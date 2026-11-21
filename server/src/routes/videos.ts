import { Router } from 'express';
import { videosQuerySchema } from '../lib/validate.js';
import { fetchVideos } from '../services/videos.js';
import { AppError, ErrorCode } from '../lib/errors.js';

const router = Router();

router.get('/videos', async (req, res, next) => {
  try {
    const parsed = videosQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.INVALID_INPUT,
        parsed.error.issues.map((i) => i.message).join('; '),
      );
    }

    const { channel, tab, sort, page } = parsed.data;
    const result = await fetchVideos(channel, tab, sort, page);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
