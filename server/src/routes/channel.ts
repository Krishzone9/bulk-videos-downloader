import { Router } from 'express';
import { channelQuerySchema } from '../lib/validate.js';
import { resolveChannel } from '../services/resolveChannel.js';
import { AppError, ErrorCode } from '../lib/errors.js';

const router = Router();

router.get('/channel', async (req, res, next) => {
  try {
    const parsed = channelQuerySchema.safeParse(req.query['q']);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.INVALID_INPUT,
        'Query parameter "q" is required (1-200 chars).',
      );
    }

    const info = await resolveChannel(parsed.data);
    res.json(info);
  } catch (err) {
    next(err);
  }
});

export default router;
