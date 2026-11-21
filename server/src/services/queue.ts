import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Job, JobStatus } from '../types.js';
import { config } from '../config.js';
import { runDownload, type DownloadHandle } from './ytdlp.js';

// Stores all jobs keyed by jobId
const jobs = new Map<string, Job>();

// Index: videoId → jobId for fast dedup lookups
const videoIndex = new Map<string, string>();

// EventEmitter per job for SSE
const emitters = new Map<string, EventEmitter>();

// Active download handles for graceful shutdown
const activeHandles = new Map<string, DownloadHandle>();

// Tracks whether each job is a short (for download strategy)
const shortFlags = new Map<string, boolean>();

// FIFO queue of jobIds waiting to run
const pending: string[] = [];

let running = 0;

/**
 * Create (or deduplicate) a download job for a video.
 */
export function createJob(videoId: string, isShort = false): Job {
  // Dedup: check if there's an existing job for this videoId
  const existingId = videoIndex.get(videoId);
  if (existingId) {
    const existing = jobs.get(existingId);
    if (existing) {
      // Active job — return it
      if (
        existing.status === 'queued' ||
        existing.status === 'downloading' ||
        existing.status === 'merging'
      ) {
        return existing;
      }

      // Done job — only return if the file actually exists on disk
      if (
        existing.status === 'done' &&
        existing.fileName &&
        fs.existsSync(existing.fileName)
      ) {
        return existing;
      }

      // Stale done/failed job — clean it up so we can retry
      jobs.delete(existingId);
      emitters.get(existingId)?.removeAllListeners();
      emitters.delete(existingId);
      videoIndex.delete(videoId);
    }
  }

  const job: Job = {
    jobId: randomUUID(),
    videoId,
    status: 'queued',
    percent: 0,
    speed: null,
    eta: null,
    fileName: null,
    error: null,
    createdAt: Date.now(),
  };

  jobs.set(job.jobId, job);
  videoIndex.set(videoId, job.jobId);
  emitters.set(job.jobId, new EventEmitter());
  shortFlags.set(job.jobId, isShort);

  pending.push(job.jobId);
  drainQueue();

  return job;
}

export function getJob(jobId: string): Job | undefined {
  return jobs.get(jobId);
}

export function subscribeToJob(
  jobId: string,
  listener: (job: Job) => void,
): (() => void) | undefined {
  const emitter = emitters.get(jobId);
  if (!emitter) return undefined;

  emitter.on('update', listener);
  return () => {
    emitter.removeListener('update', listener);
  };
}

function emitUpdate(jobId: string): void {
  const job = jobs.get(jobId);
  const emitter = emitters.get(jobId);
  if (job && emitter) {
    emitter.emit('update', { ...job });
  }
}

function updateJob(jobId: string, patch: Partial<Job>): void {
  const job = jobs.get(jobId);
  if (!job) return;
  Object.assign(job, patch);
  emitUpdate(jobId);
}

function drainQueue(): void {
  while (running < config.MAX_CONCURRENT && pending.length > 0) {
    const jobId = pending.shift()!;
    const job = jobs.get(jobId);
    if (!job || job.status !== 'queued') continue;

    running++;
    startDownload(jobId, job.videoId, shortFlags.get(jobId) ?? false);
  }
}

function startDownload(jobId: string, videoId: string, isShort: boolean): void {
  updateJob(jobId, { status: 'downloading' });

  const handle = runDownload(videoId, isShort, {
    onProgress(percent, speed, eta) {
      const job = jobs.get(jobId);
      if (!job) return;
      const status: JobStatus =
        percent >= 100 ? 'merging' : 'downloading';
      updateJob(jobId, { percent: Math.min(percent, 99), speed, eta, status });
    },

    onFilePath(filePath) {
      updateJob(jobId, { fileName: path.resolve(filePath) });
    },

    onDone() {
      activeHandles.delete(jobId);
      updateJob(jobId, { status: 'done', percent: 100 });
      running--;
      drainQueue();
    },

    onError(err) {
      activeHandles.delete(jobId);
      updateJob(jobId, {
        status: 'failed',
        error: err.message,
      });
      running--;
      drainQueue();
    },
  });

  activeHandles.set(jobId, handle);
}

/** Kill all running child processes (for graceful shutdown). */
export function killAll(): void {
  for (const [id, handle] of activeHandles) {
    handle.kill();
    activeHandles.delete(id);
  }
}

// Cleanup stale jobs and files every hour
const cleanupTimer = setInterval(
  () => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const [id, job] of jobs) {
      if (job.createdAt < cutoff) {
        if (job.fileName) {
          try {
            fs.unlinkSync(job.fileName);
          } catch {
            /* file may already be gone */
          }
        }
        jobs.delete(id);
        videoIndex.delete(job.videoId);
        emitters.get(id)?.removeAllListeners();
        emitters.delete(id);
        activeHandles.delete(id);
        shortFlags.delete(id);
      }
    }
  },
  60 * 60 * 1000,
);
cleanupTimer.unref();
