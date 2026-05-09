// HTTP status code thresholds, shared by everything that buckets or styles a
// status. Keeping them here means filter / stats / formatting / detail-panel
// styling all agree on the same boundaries.

export const HTTP_STATUS = {
  OK_MIN: 200,
  REDIRECT_MIN: 300,
  CLIENT_ERR_MIN: 400,
  SERVER_ERR_MIN: 500,
  RANGE_END: 600,
  NOT_MODIFIED: 304,
  // HAR uses 0 to indicate the request never produced a response (network
  // failure, blocked, etc.). Treat it as an error.
  FETCH_ERROR: 0,
} as const;

export type StatusBucket = "2xx" | "3xx" | "4xx" | "5xx" | "other";

export function statusBucket(status: number): StatusBucket {
  if (status >= HTTP_STATUS.OK_MIN && status < HTTP_STATUS.REDIRECT_MIN)
    return "2xx";
  if (status >= HTTP_STATUS.REDIRECT_MIN && status < HTTP_STATUS.CLIENT_ERR_MIN)
    return "3xx";
  if (status >= HTTP_STATUS.CLIENT_ERR_MIN && status < HTTP_STATUS.SERVER_ERR_MIN)
    return "4xx";
  if (status >= HTTP_STATUS.SERVER_ERR_MIN && status < HTTP_STATUS.RANGE_END)
    return "5xx";
  return "other";
}

// Severity is the presentation-agnostic version of the bucket — callers map
// it to whatever output they need (CSS variable, Tailwind class, etc.) so
// the threshold logic lives in exactly one place.
export type StatusSeverity = "ok" | "redirect" | "warn" | "err";

export function statusSeverity(status: number): StatusSeverity {
  if (status === HTTP_STATUS.FETCH_ERROR) return "err";
  if (status >= HTTP_STATUS.SERVER_ERR_MIN) return "err";
  if (status >= HTTP_STATUS.CLIENT_ERR_MIN) return "warn";
  if (status >= HTTP_STATUS.REDIRECT_MIN) return "redirect";
  if (status >= HTTP_STATUS.OK_MIN) return "ok";
  return "redirect";
}

export function isErrorStatus(status: number): boolean {
  return (
    status === HTTP_STATUS.FETCH_ERROR || status >= HTTP_STATUS.CLIENT_ERR_MIN
  );
}
