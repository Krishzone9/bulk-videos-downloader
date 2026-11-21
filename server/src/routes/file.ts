import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { getJob } from '../services/queue.js';
import { config } from '../config.js';
import { AppError, ErrorCode } from '../lib/errors.js';

const router = Router();

// Normalize path separators and casing for consistent comparison on Windows
function normalizePath(p: string): string {
  return path.resolve(p).replace(/\\/g, '/').toLowerCase();
}

router.get('/file/:jobId', (req, res, next) => {
  try {
    const jobId = req.params['jobId'];
    if (!jobId) {
      throw new AppError(ErrorCode.INVALID_INPUT, 'Missing jobId.');
    }

    const job = getJob(jobId);
    if (!job || job.status !== 'done' || !job.fileName) {
      throw new AppError(
        ErrorCode.VIDEO_UNAVAILABLE,
        'File is not available for download yet.',
      );
    }

    const resolved = path.resolve(job.fileName);
    const normalizedResolved = normalizePath(resolved);
    const normalizedDir = normalizePath(config.DOWNLOAD_DIR);

    // Prevent path traversal outside DOWNLOAD_DIR
    if (!normalizedResolved.startsWith(normalizedDir)) {
      throw new AppError(ErrorCode.INVALID_INPUT, 'Invalid file path.');
    }

    if (!fs.existsSync(resolved)) {
      throw new AppError(ErrorCode.VIDEO_UNAVAILABLE, 'File not found on disk.');
    }

    const stat = fs.statSync(resolved);
    const basename = path.basename(resolved);
    // ASCII-safe fallback + RFC 5987 filename* for non-ASCII characters
    const asciiFallback = basename.replace(/[^\x20-\x7E]/g, '_');
    const encoded = encodeURIComponent(basename);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`,
    );
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stat.size);

    const stream = fs.createReadStream(resolved);
    stream.pipe(res);

    stream.on('error', (err) => {
      console.error('[file stream error]', err);
      if (!res.headersSent) {
        res.status(500).json({
          error: { code: ErrorCode.INTERNAL, message: 'File read error.' },
        });
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
