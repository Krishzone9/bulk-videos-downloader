import type { Request, Response, NextFunction } from 'express';

export const ErrorCode = {
  INVALID_INPUT: 'INVALID_INPUT',
  CHANNEL_NOT_FOUND: 'CHANNEL_NOT_FOUND',
  VIDEO_UNAVAILABLE: 'VIDEO_UNAVAILABLE',
  AGE_RESTRICTED: 'AGE_RESTRICTED',
  PRIVATE_VIDEO: 'PRIVATE_VIDEO',
  NETWORK_ERROR: 'NETWORK_ERROR',
  YTDLP_MISSING: 'YTDLP_MISSING',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',
} as const;

const STATUS_MAP: Record<string, number> = {
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.CHANNEL_NOT_FOUND]: 404,
  [ErrorCode.VIDEO_UNAVAILABLE]: 404,
  [ErrorCode.AGE_RESTRICTED]: 403,
  [ErrorCode.PRIVATE_VIDEO]: 403,
  [ErrorCode.NETWORK_ERROR]: 502,
  [ErrorCode.YTDLP_MISSING]: 500,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.INTERNAL]: 500,
};

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode ?? STATUS_MAP[code] ?? 500;
  }
}

export function mapStderrToError(stderr: string): AppError {
  const lower = stderr.toLowerCase();

  // yt-dlp binary missing (check narrowly to avoid false positives)
  if (
    lower.includes('is not recognized') ||
    lower.includes('enoent')
  ) {
    return new AppError(
      ErrorCode.YTDLP_MISSING,
      'yt-dlp is not installed or not found in PATH',
    );
  }

  // Age-restricted — only match the actual yt-dlp message, NOT bare "age"
  if (
    lower.includes('sign in to confirm your age') ||
    lower.includes('age-restricted') ||
    lower.includes('age restricted') ||
    lower.includes('confirm your age')
  ) {
    return new AppError(
      ErrorCode.AGE_RESTRICTED,
      'This video is age-restricted. Configure YTDLP_COOKIES_FROM_BROWSER.',
    );
  }

  if (
    lower.includes('private video') ||
    lower.includes('this video is private')
  ) {
    return new AppError(
      ErrorCode.PRIVATE_VIDEO,
      'This video is private and cannot be downloaded.',
    );
  }

  if (
    lower.includes('video unavailable') ||
    lower.includes('this video is unavailable') ||
    lower.includes('is not a valid url')
  ) {
    return new AppError(
      ErrorCode.VIDEO_UNAVAILABLE,
      'The requested video is unavailable.',
    );
  }

  if (
    lower.includes('channel not found') ||
    lower.includes('does not exist') ||
    lower.includes('the channel url') ||
    lower.includes('unable to recognize tab page')
  ) {
    return new AppError(
      ErrorCode.CHANNEL_NOT_FOUND,
      'The YouTube channel was not found.',
    );
  }

  if (
    lower.includes('unable to download') ||
    lower.includes('urlopen error') ||
    lower.includes('network')
  ) {
    return new AppError(
      ErrorCode.NETWORK_ERROR,
      'A network error occurred while contacting YouTube.',
    );
  }

  if (lower.includes('too many requests') || lower.includes('429')) {
    return new AppError(
      ErrorCode.RATE_LIMITED,
      'YouTube is rate-limiting requests. Try again later.',
    );
  }

  return new AppError(ErrorCode.INTERNAL, stderr.slice(0, 500));
}

/** Express error-handling middleware */
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  const message =
    err instanceof Error ? err.message : 'An unexpected error occurred';
  console.error('[unhandled]', err);
  res.status(500).json({
    error: { code: ErrorCode.INTERNAL, message },
  });
}
