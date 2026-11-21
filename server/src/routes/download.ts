import { Router } from 'express';
import { downloadBodySchema, batchDownloadBodySchema } from '../lib/validate.js';
import { createJob } from '../services/queue.js';
import { AppError, ErrorCode } from '../lib/errors.js';

const router = Router();

router.post('/download', (req, res, next) => {
  try {
    const parsed = downloadBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(ErrorCode.INVALID_INPUT, 'Invalid videoId.');
    }

    const job = createJob(parsed.data.videoId, parsed.data.isShort);
    res.status(201).json({ jobId: job.jobId });
  } catch (err) {
    next(err);
  }
});

router.post('/download/batch', (req, res, next) => {
  try {
    const parsed = batchDownloadBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.INVALID_INPUT,
        'Invalid videoIds array (1-50 valid IDs required).',
      );
    }

    const jobIds = parsed.data.videoIds.map(
      (vid) => createJob(vid, parsed.data.isShort).jobId,
    );
    res.status(201).json({ jobIds });
  } catch (err) {
    next(err);
  }
});

export default router;
