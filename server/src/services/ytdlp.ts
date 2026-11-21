import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { mapStderrToError, AppError, ErrorCode } from '../lib/errors.js';

/**
 * Run yt-dlp with JSON output and return the parsed result.
 * Throws AppError on non-zero exit or timeout.
 */
export function runJson(args: string[], timeoutMs = 120_000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const child = spawn(config.YTDLP_PATH, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(
        new AppError(ErrorCode.NETWORK_ERROR, `yt-dlp timed out after ${timeoutMs / 1000}s`),
      );
    }, timeoutMs);

    child.on('error', (err) => {
      clearTimeout(timeout);
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(
          new AppError(
            ErrorCode.YTDLP_MISSING,
            'yt-dlp is not installed or not found in PATH',
          ),
        );
      } else {
        reject(new AppError(ErrorCode.INTERNAL, err.message));
      }
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      const stderr = Buffer.concat(stderrChunks).toString('utf-8');

      if (code !== 0) {
        reject(mapStderrToError(stderr));
        return;
      }

      const stdout = Buffer.concat(stdoutChunks).toString('utf-8');
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(
          new AppError(ErrorCode.INTERNAL, 'Failed to parse yt-dlp output'),
        );
      }
    });
  });
}

export interface DownloadHandle {
  kill(): void;
}

export interface DownloadCallbacks {
  onProgress: (percent: number, speed: string | null, eta: string | null) => void;
  onFilePath: (filePath: string) => void;
  onDone: () => void;
  onError: (err: AppError) => void;
}

/**
 * Spawn a yt-dlp download for a single video.
 * Returns a handle to kill the child process.
 *
 * Uses separate strategies for shorts (single-stream, stdout filepath)
 * and long videos (video+audio merge, file-scan on completion).
 */
export function runDownload(
  videoId: string,
  isShort: boolean,
  callbacks: DownloadCallbacks,
): DownloadHandle {
  const args = isShort
    ? buildShortDownloadArgs(videoId)
    : buildLongDownloadArgs(videoId);

  const child: ChildProcess = spawn(config.YTDLP_PATH, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  const errorLines: string[] = [];
  let killed = false;
  let filePath: string | null = null;

  // stdout: only --print output (FILEPATH lines) — shorts only
  child.stdout?.on('data', (chunk: Buffer) => {
    const lines = chunk.toString('utf-8').split('\n');
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      if (line.startsWith('FILEPATH|')) {
        filePath = line.slice('FILEPATH|'.length).trim();
        callbacks.onFilePath(filePath);
      }
    }
  });

  // stderr: progress-template output + [Merger] notices + real errors
  child.stderr?.on('data', (chunk: Buffer) => {
    const lines = chunk.toString('utf-8').split('\n');
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      if (line.startsWith('PROGRESS|')) {
        parseProgress(line, callbacks.onProgress);
      } else if (
        line.includes('[Merger]') ||
        line.includes('[Merge]') ||
        line.includes('Merging')
      ) {
        // Signal merging phase
        callbacks.onProgress(100, null, null);
      } else if (
        // Skip informational lines (not errors)
        !line.startsWith('[download]') &&
        !line.startsWith('[info]') &&
        !line.startsWith('[youtube]') &&
        !line.startsWith('[ExtractAudio]') &&
        !line.startsWith('Deleting')
      ) {
        errorLines.push(line);
      }
    }
  });

  child.on('error', (err) => {
    if (killed) return;
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      callbacks.onError(
        new AppError(
          ErrorCode.YTDLP_MISSING,
          'yt-dlp is not installed or not found in PATH',
        ),
      );
    } else {
      callbacks.onError(new AppError(ErrorCode.INTERNAL, err.message));
    }
  });

  child.on('close', (code) => {
    if (killed) return;

    if (code !== 0) {
      const stderr = errorLines.join('\n');
      callbacks.onError(
        mapStderrToError(stderr || `yt-dlp exited with code ${code}`),
      );
      return;
    }

    // For shorts: filePath is captured from stdout --print output
    // For long videos: scan DOWNLOAD_DIR for the output file
    if (!filePath && !isShort) {
      filePath = findOutputFile(videoId);
      if (filePath) {
        callbacks.onFilePath(filePath);
      }
    }

    if (filePath) {
      callbacks.onDone();
    } else {
      callbacks.onError(
        new AppError(
          ErrorCode.INTERNAL,
          'Download completed but output file was not found.',
        ),
      );
    }
  });

  return {
    kill() {
      killed = true;
      child.kill('SIGTERM');
    },
  };
}

/**
 * Scan DOWNLOAD_DIR for the final output file matching [videoId].mp4.
 * Used for long videos where --print stdout hooks are unreliable
 * due to the video+audio merge pipeline.
 */
function findOutputFile(videoId: string): string | null {
  const suffix = `[${videoId}].mp4`;
  try {
    const files = fs.readdirSync(config.DOWNLOAD_DIR);
    for (const file of files) {
      if (file.endsWith(suffix)) {
        return path.join(config.DOWNLOAD_DIR, file);
      }
    }
  } catch {
    // dir doesn't exist or can't be read
  }
  return null;
}

/**
 * Args for shorts — single stream, --print after_move for filepath.
 */
function buildShortDownloadArgs(videoId: string): string[] {
  const args = [
    '--no-playlist',
    '-f',
    'bv*+ba/b',
    '--merge-output-format',
    'mp4',
    '--newline',
    '--progress-template',
    'download:PROGRESS|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress._speed_str)s|%(progress._eta_str)s',
    '--print',
    'after_move:FILEPATH|%(filepath)s',
    '-o',
    `${config.DOWNLOAD_DIR.replace(/\\/g, '/')}/%(title).120B [%(id)s].%(ext)s`,
    '--windows-filenames',
    '--no-warnings',
  ];

  if (config.YTDLP_COOKIES_FROM_BROWSER) {
    args.push('--cookies-from-browser', config.YTDLP_COOKIES_FROM_BROWSER);
  }

  args.push('--', `https://www.youtube.com/watch?v=${videoId}`);
  return args;
}

/**
 * Args for long videos — no --print (filepath found via file scan),
 * with retry/timeout for large downloads and prefer pre-muxed mp4.
 */
function buildLongDownloadArgs(videoId: string): string[] {
  const args = [
    '--no-playlist',
    // Prefer a pre-muxed mp4 (no merge needed), fall back to best combo
    '-f',
    'best[ext=mp4]/bv*+ba/b',
    '--merge-output-format',
    'mp4',
    '--newline',
    '--progress-template',
    'download:PROGRESS|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress._speed_str)s|%(progress._eta_str)s',
    '-o',
    `${config.DOWNLOAD_DIR.replace(/\\/g, '/')}/%(title).120B [%(id)s].%(ext)s`,
    '--windows-filenames',
    '--no-warnings',
    // Retry on transient network hiccups (common with large files)
    '--retries',
    '10',
    '--fragment-retries',
    '10',
    // Abort stalled connections instead of hanging forever
    '--socket-timeout',
    '30',
  ];

  if (config.YTDLP_COOKIES_FROM_BROWSER) {
    args.push('--cookies-from-browser', config.YTDLP_COOKIES_FROM_BROWSER);
  }

  args.push('--', `https://www.youtube.com/watch?v=${videoId}`);
  return args;
}

function parseProgress(
  line: string,
  onProgress: (percent: number, speed: string | null, eta: string | null) => void,
): void {
  const parts = line.split('|');
  const downloadedStr = parts[1] ?? '';
  const totalStr = parts[2] ?? '';
  const estimateStr = parts[3] ?? '';
  const speedRaw = parts[4];
  const etaRaw = parts[5];

  const downloaded = parseFloat(downloadedStr) || 0;
  const total = parseFloat(totalStr) || 0;
  const estimate = parseFloat(estimateStr) || 0;

  const denominator = total > 0 ? total : estimate > 0 ? estimate : 0;
  const percent =
    denominator > 0
      ? Math.min(99, Math.round((downloaded / denominator) * 100))
      : downloaded > 0
        ? 1
        : 0;

  const speed =
    speedRaw && speedRaw !== 'NA' && speedRaw !== 'Unknown' && !speedRaw.includes('N/A')
      ? speedRaw.trim()
      : null;
  const eta =
    etaRaw && etaRaw !== 'NA' && etaRaw !== 'Unknown' && !etaRaw.includes('N/A')
      ? etaRaw.trim()
      : null;

  onProgress(percent, speed, eta);
}
