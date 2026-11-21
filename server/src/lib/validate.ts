import { z } from 'zod';

export const channelQuerySchema = z.string().min(1).max(200);

export const videoIdSchema = z.string().regex(/^[A-Za-z0-9_-]{11}$/);

export const videosQuerySchema = z.object({
  channel: z.string().startsWith('UC'),
  tab: z.enum(['videos', 'shorts']).default('videos'),
  sort: z.enum(['latest', 'popular', 'oldest']).default('latest'),
  page: z.coerce.number().int().min(1).default(1),
});

export const downloadBodySchema = z.object({
  videoId: videoIdSchema,
  isShort: z.boolean().optional().default(false),
});

export const batchDownloadBodySchema = z.object({
  videoIds: z.array(videoIdSchema).min(1).max(50),
  isShort: z.boolean().optional().default(false),
});
