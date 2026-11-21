import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { config } from './config.js';
import { errorMiddleware, ErrorCode } from './lib/errors.js';
import { killAll } from './services/queue.js';
import channelRouter from './routes/channel.js';
import videosRouter from './routes/videos.js';
import downloadRouter from './routes/download.js';
import progressRouter from './routes/progress.js';
import fileRouter from './routes/file.js';

const app = express();

// Body parser with 10kb limit
app.use(express.json({ limit: '10kb' }));

// CORS restricted to configured origin
app.use(cors({ origin: config.CORS_ORIGIN }));

// General rate limit: 60 requests/min
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: ErrorCode.RATE_LIMITED, message: 'Too many requests.' },
  },
});
app.use('/api', generalLimiter);

// Stricter rate limit on download endpoints: 10 requests/min
const downloadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: ErrorCode.RATE_LIMITED,
      message: 'Too many download requests.',
    },
  },
});
app.use('/api/download', downloadLimiter);

// Health endpoint
app.get('/api/health', (_req, res) => {
  let ytdlpVersion: string | null = null;
  let ffmpegOk = false;

  try {
    const yt = spawnSync(config.YTDLP_PATH, ['--version'], {
      encoding: 'utf-8',
      timeout: 5000,
      windowsHide: true,
    });
    if (yt.status === 0 && typeof yt.stdout === 'string') {
      ytdlpVersion = yt.stdout.trim();
    }
  } catch { /* not installed */ }

  try {
    const ff = spawnSync('ffmpeg', ['-version'], {
      encoding: 'utf-8',
      timeout: 5000,
      windowsHide: true,
    });
    ffmpegOk = ff.status === 0;
  } catch { /* not installed */ }

  res.json({
    ok: true,
    ytdlp: ytdlpVersion,
    ffmpeg: ffmpegOk,
  });
});

// Mount routes
app.use('/api', channelRouter);
app.use('/api', videosRouter);
app.use('/api', downloadRouter);
app.use('/api', progressRouter);
app.use('/api', fileRouter);

// Error middleware (must be last)
app.use(errorMiddleware);

// Ensure download directory exists
if (!fs.existsSync(config.DOWNLOAD_DIR)) {
  fs.mkdirSync(config.DOWNLOAD_DIR, { recursive: true });
}

const server = app.listen(config.PORT, () => {
  console.log(`Server listening on http://localhost:${config.PORT}`);
});

// Graceful shutdown
function shutdown(): void {
  console.log('\nShutting down gracefully...');
  killAll();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
