import type {
  HarEntry,
  HarFile,
  NormalizedEntry,
  NormalizedTimings,
  ParsedHar,
  RequestCategory,
} from "../types/har";
import { HTTP_STATUS, isErrorStatus } from "./http";

export class HarParseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "HarParseError";
  }
}

export function parseHarText(text: string): ParsedHar {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    throw new HarParseError("File is not valid JSON.", { cause: err });
  }
  if (!isHarFile(raw)) {
    throw new HarParseError(
      "File doesn't look like a HAR archive (missing log.entries).",
    );
  }
  return parseHar(raw);
}

export function parseHar(file: HarFile): ParsedHar {
  const entries = file.log.entries.map((e, idx) => normalizeEntry(e, idx));

  let startedAt = Number.POSITIVE_INFINITY;
  let endedAt = 0;
  for (const e of entries) {
    if (e.startedAt < startedAt) startedAt = e.startedAt;
    if (e.endedAt > endedAt) endedAt = e.endedAt;
  }
  if (!Number.isFinite(startedAt)) startedAt = 0;

  return {
    file,
    entries,
    pages: file.log.pages ?? [],
    startedAt,
    endedAt,
  };
}

function normalizeEntry(entry: HarEntry, id: number): NormalizedEntry {
  const startedAt = Date.parse(entry.startedDateTime);
  const duration = Math.max(0, entry.time);
  const url = entry.request.url;
  const { host, path } = splitUrl(url);
  const mimeType = entry.response.content?.mimeType ?? "";
  const category = categorize(entry._resourceType, mimeType, url);
  const timings = normalizeTimings(entry);

  const transferSize =
    typeof entry.response._transferSize === "number" &&
    entry.response._transferSize >= 0
      ? entry.response._transferSize
      : Math.max(0, entry.response.bodySize) +
        Math.max(0, entry.response.headersSize);

  const status = entry.response.status;
  const hasError = isErrorStatus(status) || Boolean(entry.response._error);
  const fromCache =
    status === HTTP_STATUS.NOT_MODIFIED ||
    Boolean(entry.cache?.afterRequest) ||
    transferSize === 0;

  return {
    id,
    raw: entry,
    startedAt,
    endedAt: startedAt + duration,
    duration,
    method: entry.request.method,
    url,
    host,
    path,
    status,
    statusText: entry.response.statusText,
    httpVersion: entry.response.httpVersion || entry.request.httpVersion,
    mimeType,
    category,
    transferSize,
    resourceSize: Math.max(0, entry.response.content?.size ?? 0),
    pageref: entry.pageref,
    timings,
    initiatorUrl: entry._initiator?.url,
    serverIPAddress: entry.serverIPAddress,
    hasError,
    fromCache,
  };
}

function normalizeTimings(entry: HarEntry): NormalizedTimings {
  const t = entry.timings;
  // HAR represents N/A as -1; coalesce to 0 for chart math.
  const safe = (v: number | undefined) => (typeof v === "number" && v > 0 ? v : 0);
  const blocked = safe(t.blocked);
  const dns = safe(t.dns);
  const connect = safe(t.connect);
  // SSL is included within `connect` per spec when present, so don't double-count
  // for total. We still surface it for the chart.
  const ssl = safe(t.ssl);
  const send = safe(t.send);
  const wait = safe(t.wait);
  const receive = safe(t.receive);
  const total =
    blocked + dns + Math.max(connect, ssl) + send + wait + receive;
  return { blocked, dns, connect, ssl, send, wait, receive, total };
}

function splitUrl(input: string): { host: string; path: string } {
  try {
    const u = new URL(input);
    return { host: u.host, path: u.pathname + u.search };
  } catch {
    return { host: "", path: input };
  }
}

function categorize(
  resourceType: string | undefined,
  mimeType: string,
  url: string,
): RequestCategory {
  const rt = resourceType?.toLowerCase();
  if (rt) {
    switch (rt) {
      case "document":
      case "stylesheet":
      case "script":
      case "image":
      case "font":
      case "media":
      case "websocket":
      case "manifest":
      case "xhr":
      case "fetch":
        return rt;
      case "preflight":
        return "fetch";
      case "ping":
      case "other":
        return "other";
    }
  }

  const mime = mimeType.toLowerCase();
  if (mime.startsWith("text/html")) return "document";
  if (mime.startsWith("text/css")) return "stylesheet";
  if (mime.includes("javascript") || mime.includes("ecmascript"))
    return "script";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("font/") || mime.includes("woff")) return "font";
  if (mime.startsWith("audio/") || mime.startsWith("video/")) return "media";
  if (mime.includes("json") || mime.includes("xml")) return "xhr";
  if (mime.includes("manifest")) return "manifest";

  if (/\.(css)(\?|$)/i.test(url)) return "stylesheet";
  if (/\.(m?js|ts)(\?|$)/i.test(url)) return "script";
  if (/\.(png|jpe?g|gif|svg|webp|avif|ico)(\?|$)/i.test(url)) return "image";
  if (/\.(woff2?|ttf|otf|eot)(\?|$)/i.test(url)) return "font";

  return "other";
}

function isHarFile(value: unknown): value is HarFile {
  if (typeof value !== "object" || value === null) return false;
  if (!("log" in value)) return false;
  const log = value.log;
  if (typeof log !== "object" || log === null) return false;
  if (!("entries" in log)) return false;
  return Array.isArray(log.entries);
}
