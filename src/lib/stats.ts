import type { ParsedHar, RequestCategory } from "../types/har";
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

export function computeStats(parsed: ParsedHar): HarStats {
  const { entries, startedAt, endedAt } = parsed;
  let totalTransferBytes = 0;
  let totalResourceBytes = 0;
  let cachedCount = 0;
  let errorCount = 0;

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

    const bucket = statusBucket(e.status);
    statusCounts[bucket]++;

    const cur = categoryAgg.get(e.category) ?? { count: 0, bytes: 0 };
    cur.count++;
    cur.bytes += e.transferSize;
    categoryAgg.set(e.category, cur);
  }

  const wallClockMs = entries.length === 0 ? 0 : Math.max(0, endedAt - startedAt);

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
