import { Router } from 'express';
import { getJob, subscribeToJob } from '../services/queue.js';
import { AppError, ErrorCode } from '../lib/errors.js';
import type { Job } from '../types.js';

const router = Router();

router.get('/progress/:jobId', (req, res) => {
  const jobId = req.params['jobId'];
  if (!jobId) {
    res.status(400).json({
      error: { code: ErrorCode.INVALID_INPUT, message: 'Missing jobId.' },
    });
    return;
  }

  const job = getJob(jobId);
  if (!job) {
    res.status(404).json({
      error: { code: ErrorCode.VIDEO_UNAVAILABLE, message: 'Job not found.' },
    });
    return;
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send the current state immediately
  sendEvent(res, job);

  // If already terminal, close after sending
  if (job.status === 'done' || job.status === 'failed') {
    res.end();
    return;
  }

  const listener = (updated: Job) => {
    sendEvent(res, updated);
    if (updated.status === 'done' || updated.status === 'failed') {
      res.end();
    }
  };

  const unsubscribe = subscribeToJob(jobId, listener);

  // Heartbeat every 15s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    if (unsubscribe) unsubscribe();
  });
});

function sendEvent(res: import('express').Response, job: Job): void {
  res.write(`data: ${JSON.stringify(job)}\n\n`);
}

export default router;
