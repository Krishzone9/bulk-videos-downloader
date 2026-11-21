import path from 'node:path';

const downloadDir = path.resolve(process.env['DOWNLOAD_DIR'] ?? '../downloads');

export const config = {
  PORT: parseInt(process.env['PORT'] ?? '4000', 10),
  CORS_ORIGIN: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
  DOWNLOAD_DIR: downloadDir,
  MAX_CONCURRENT: parseInt(process.env['MAX_CONCURRENT'] ?? '3', 10),
  PAGE_SIZE: parseInt(process.env['PAGE_SIZE'] ?? '30', 10),
  YTDLP_PATH: process.env['YTDLP_PATH'] ?? 'yt-dlp',
  YTDLP_COOKIES_FROM_BROWSER:
    process.env['YTDLP_COOKIES_FROM_BROWSER'] ?? null,
} as const;
