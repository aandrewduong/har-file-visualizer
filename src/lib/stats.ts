import type { NormalizedEntry, RequestCategory } from "../types/har";
import type { StatusBucket } from "./http";
import { statusBucket } from "./http";

export interface HarStats {
  totalRequests: number;
  totalTransferBytes: number;
  totalResourceBytes: number;
  /** Wall-clock duration from first request start to last request end. */
  wallClockMs: number;
  statusBuckets: { label: string; count: number }[];
  byCategory: { category: RequestCategory; count: number; bytes: number }[];
  cachedCount: number;
  errorCount: number;
}

export function computeStats(entries: NormalizedEntry[]): HarStats {
  let totalTransferBytes = 0;
  let totalResourceBytes = 0;
  let cachedCount = 0;
  let errorCount = 0;
  let firstStart = Number.POSITIVE_INFINITY;
  let lastEnd = 0;

  const statusCounts: Record<StatusBucket, number> = {
    "2xx": 0,
    "3xx": 0,
    "4xx": 0,
    "5xx": 0,
    other: 0,
  };
  const categoryAgg = new Map<RequestCategory, { count: number; bytes: number }>();

  for (const e of entries) {
    totalTransferBytes += e.transferSize;
    totalResourceBytes += e.resourceSize;
    if (e.fromCache) cachedCount++;
    if (e.hasError) errorCount++;
    if (e.startedAt < firstStart) firstStart = e.startedAt;
    if (e.endedAt > lastEnd) lastEnd = e.endedAt;

    const bucket = statusBucket(e.status);
    statusCounts[bucket]++;

    const cur = categoryAgg.get(e.category) ?? { count: 0, bytes: 0 };
    cur.count++;
    cur.bytes += e.transferSize;
    categoryAgg.set(e.category, cur);
  }

  if (!Number.isFinite(firstStart)) firstStart = 0;
  const wallClockMs = entries.length === 0 ? 0 : Math.max(0, lastEnd - firstStart);

  const byCategory = Array.from(categoryAgg.entries())
    .map(([category, agg]) => ({ category, ...agg }))
    .sort((a, b) => b.count - a.count);

  const statusBuckets = (["2xx", "3xx", "4xx", "5xx", "other"] as const).map(
    (label) => ({ label, count: statusCounts[label] }),
  );

  return {
    totalRequests: entries.length,
    totalTransferBytes,
    totalResourceBytes,
    wallClockMs,
    statusBuckets,
    byCategory,
    cachedCount,
    errorCount,
  };
}
