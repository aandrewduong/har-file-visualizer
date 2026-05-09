// Generates the bundled example HAR files served from `public/examples/`.
// Re-run via `npm run gen-examples` whenever the example set changes.
//
// HARs are hand-authored, synthetic, and contain no real cookies / auth /
// PII so they're safe to ship publicly with the static site.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = join(ROOT, "public", "examples");

const CREATOR = { name: "HAR File Visualizer Examples", version: "1.0" };

// HAR uses -1 to mean "phase not measured / not applicable" (e.g. reused
// connection has no dns/connect/ssl). Defaults reflect that; entries override
// per-phase values where they were measured.
const TIMING_DEFAULTS = {
  blocked: -1,
  dns: -1,
  connect: -1,
  ssl: -1,
  send: 0,
  wait: 0,
  receive: 0,
};

/**
 * @typedef EntrySpec
 * @property {string} method
 * @property {string} url
 * @property {number} status
 * @property {string} statusText
 * @property {string} mimeType
 * @property {string} resourceType
 * @property {number} startOffsetMs    // offset from page start
 * @property {number} blocked
 * @property {number} dns
 * @property {number} connect
 * @property {number} ssl
 * @property {number} send
 * @property {number} wait
 * @property {number} receive
 * @property {number} contentSize       // decoded body size in bytes
 * @property {number} transferSize      // wire size in bytes
 * @property {string} [responseBody]    // optional response text
 * @property {string} [pageref]
 * @property {Array<{name:string,value:string}>} [extraReqHeaders]
 * @property {Array<{name:string,value:string}>} [extraResHeaders]
 */

/**
 * @param {Date} pageStart
 * @param {EntrySpec} s
 */
function makeEntry(pageStart, s) {
  const startedAt = new Date(pageStart.getTime() + s.startOffsetMs);
  const totalTime =
    Math.max(0, s.blocked) +
    Math.max(0, s.dns) +
    Math.max(0, s.connect) +
    s.send +
    s.wait +
    s.receive;
  const url = new URL(s.url);
  const queryString = Array.from(url.searchParams.entries()).map(([n, v]) => ({
    name: n,
    value: v,
  }));
  const reqHeaders = [
    { name: "Host", value: url.host },
    { name: "Accept", value: "*/*" },
    { name: "User-Agent", value: "Mozilla/5.0 (example)" },
    ...(s.extraReqHeaders ?? []),
  ];
  const resHeaders = [
    { name: "Content-Type", value: s.mimeType },
    { name: "Content-Length", value: String(s.contentSize) },
    ...(s.extraResHeaders ?? []),
  ];
  return {
    pageref: s.pageref,
    startedDateTime: startedAt.toISOString(),
    time: totalTime,
    request: {
      method: s.method,
      url: s.url,
      httpVersion: "HTTP/2",
      cookies: [],
      headers: reqHeaders,
      queryString,
      headersSize: -1,
      bodySize: 0,
    },
    response: {
      status: s.status,
      statusText: s.statusText,
      httpVersion: "HTTP/2",
      cookies: [],
      headers: resHeaders,
      content: {
        size: s.contentSize,
        mimeType: s.mimeType,
        ...(s.responseBody ? { text: s.responseBody } : {}),
      },
      redirectURL: "",
      headersSize: -1,
      bodySize: s.contentSize,
      _transferSize: s.transferSize,
    },
    cache: {},
    timings: {
      blocked: s.blocked,
      dns: s.dns,
      connect: s.connect,
      ssl: s.ssl,
      send: s.send,
      wait: s.wait,
      receive: s.receive,
    },
    serverIPAddress: "203.0.113.10",
    connection: "443",
    _resourceType: s.resourceType,
  };
}

/**
 * @param {Date} pageStart
 * @param {Partial<EntrySpec>} overrides
 * @returns {EntrySpec}
 */
function entryDefaults(_pageStart, overrides) {
  return {
    method: "GET",
    url: "https://example.com/",
    status: 200,
    statusText: "OK",
    mimeType: "text/plain",
    resourceType: "other",
    startOffsetMs: 0,
    contentSize: 0,
    transferSize: 0,
    ...TIMING_DEFAULTS,
    ...overrides,
  };
}

function buildNewsSite() {
  const pageStart = new Date("2026-05-09T15:00:00.000Z");
  const pageId = "page_news";
  const e = (overrides) =>
    makeEntry(pageStart, { ...entryDefaults(pageStart, overrides), pageref: pageId });

  const entries = [
    e({
      url: "https://news.example.com/articles/2026/welcome",
      mimeType: "text/html",
      resourceType: "document",
      contentSize: 18432,
      transferSize: 6210,
      startOffsetMs: 0,
      blocked: 2,
      dns: 14,
      connect: 22,
      ssl: 18,
      send: 0.3,
      wait: 142,
      receive: 28,
    }),
    e({
      url: "https://news.example.com/static/main.css",
      mimeType: "text/css",
      resourceType: "stylesheet",
      contentSize: 24576,
      transferSize: 5640,
      startOffsetMs: 178,
      blocked: 1.2,
      send: 0.2,
      wait: 36,
      receive: 9,
    }),
    e({
      url: "https://news.example.com/static/app.js",
      mimeType: "application/javascript",
      resourceType: "script",
      contentSize: 102400,
      transferSize: 31488,
      startOffsetMs: 182,
      blocked: 1.4,
      send: 0.2,
      wait: 64,
      receive: 22,
    }),
    e({
      url: "https://news.example.com/favicon.ico",
      mimeType: "image/x-icon",
      resourceType: "image",
      contentSize: 1150,
      transferSize: 1340,
      startOffsetMs: 184,
      blocked: 0.9,
      send: 0.2,
      wait: 14,
      receive: 1,
    }),
    e({
      url: "https://cdn.example.com/fonts/inter-regular.woff2",
      mimeType: "font/woff2",
      resourceType: "font",
      contentSize: 36500,
      transferSize: 36720,
      startOffsetMs: 220,
      blocked: 1.1,
      dns: 18,
      connect: 24,
      ssl: 20,
      send: 0.2,
      wait: 41,
      receive: 6,
    }),
    e({
      url: "https://cdn.example.com/img/hero.webp",
      mimeType: "image/webp",
      resourceType: "image",
      contentSize: 84210,
      transferSize: 84392,
      startOffsetMs: 262,
      blocked: 0.8,
      send: 0.2,
      wait: 52,
      receive: 18,
    }),
    e({
      url: "https://cdn.example.com/img/thumb-1.jpg",
      mimeType: "image/jpeg",
      resourceType: "image",
      contentSize: 18420,
      transferSize: 18602,
      startOffsetMs: 268,
      blocked: 0.8,
      send: 0.2,
      wait: 46,
      receive: 5,
    }),
    e({
      url: "https://cdn.example.com/img/thumb-2.jpg",
      mimeType: "image/jpeg",
      resourceType: "image",
      contentSize: 15820,
      transferSize: 16002,
      startOffsetMs: 268,
      blocked: 0.8,
      send: 0.2,
      wait: 48,
      receive: 5,
    }),
    e({
      url: "https://news.example.com/api/related?article=welcome",
      mimeType: "application/json",
      resourceType: "fetch",
      contentSize: 842,
      transferSize: 1024,
      responseBody: JSON.stringify(
        {
          related: [
            { id: "a-1", title: "How HAR files work" },
            { id: "a-2", title: "Reading network waterfalls" },
          ],
        },
        null,
        2,
      ),
      startOffsetMs: 360,
      blocked: 1.0,
      send: 0.3,
      wait: 84,
      receive: 4,
    }),
    e({
      url: "https://news.example.com/api/comments/welcome",
      mimeType: "application/json",
      resourceType: "fetch",
      contentSize: 412,
      transferSize: 612,
      responseBody: JSON.stringify({ comments: [] }, null, 2),
      startOffsetMs: 364,
      blocked: 0.9,
      send: 0.2,
      wait: 71,
      receive: 3,
    }),
    e({
      url: "https://news.example.com/static/late.js",
      mimeType: "application/javascript",
      resourceType: "script",
      contentSize: 12200,
      transferSize: 4880,
      startOffsetMs: 470,
      blocked: 0.7,
      send: 0.2,
      wait: 28,
      receive: 4,
    }),
    e({
      url: "https://news.example.com/api/track?event=read",
      mimeType: "application/json",
      method: "POST",
      resourceType: "fetch",
      contentSize: 22,
      transferSize: 220,
      responseBody: JSON.stringify({ ok: true }),
      startOffsetMs: 540,
      blocked: 0.6,
      send: 0.3,
      wait: 18,
      receive: 1,
    }),
  ];

  return {
    log: {
      version: "1.2",
      creator: CREATOR,
      pages: [
        {
          startedDateTime: pageStart.toISOString(),
          id: pageId,
          title: "https://news.example.com/articles/2026/welcome",
          pageTimings: { onContentLoad: 412, onLoad: 562 },
        },
      ],
      entries,
    },
  };
}

function buildApiDebug() {
  const pageStart = new Date("2026-05-09T18:42:11.000Z");
  const e = (overrides) => makeEntry(pageStart, entryDefaults(pageStart, overrides));

  const entries = [
    e({
      url: "https://api.example.com/v1/auth/me",
      mimeType: "application/json",
      resourceType: "fetch",
      status: 401,
      statusText: "Unauthorized",
      contentSize: 64,
      transferSize: 280,
      responseBody: JSON.stringify({ error: "missing_token" }),
      startOffsetMs: 0,
      blocked: 1.4,
      dns: 11,
      connect: 18,
      ssl: 14,
      send: 0.3,
      wait: 86,
      receive: 2,
      extraReqHeaders: [{ name: "Accept", value: "application/json" }],
    }),
    e({
      url: "https://api.example.com/v1/auth/login",
      mimeType: "application/json",
      method: "POST",
      resourceType: "fetch",
      contentSize: 184,
      transferSize: 412,
      responseBody: JSON.stringify(
        { token: "REDACTED-DEMO-TOKEN", expiresIn: 3600 },
        null,
        2,
      ),
      startOffsetMs: 92,
      blocked: 0.9,
      send: 0.4,
      wait: 142,
      receive: 4,
    }),
    e({
      url: "https://api.example.com/v1/items?page=1",
      mimeType: "application/json",
      resourceType: "fetch",
      contentSize: 4096,
      transferSize: 1280,
      responseBody: JSON.stringify(
        {
          page: 1,
          items: Array.from({ length: 3 }, (_, i) => ({
            id: `item-${i + 1}`,
            name: `Item ${i + 1}`,
          })),
        },
        null,
        2,
      ),
      startOffsetMs: 244,
      blocked: 1.0,
      send: 0.3,
      wait: 612,
      receive: 14,
    }),
    e({
      url: "https://api.example.com/v1/items",
      mimeType: "application/json",
      method: "POST",
      resourceType: "fetch",
      status: 201,
      statusText: "Created",
      contentSize: 96,
      transferSize: 320,
      responseBody: JSON.stringify({ id: "item-4", name: "New thing" }, null, 2),
      startOffsetMs: 880,
      blocked: 0.8,
      send: 0.6,
      wait: 188,
      receive: 3,
    }),
    e({
      url: "https://api.example.com/v1/items/item-4",
      mimeType: "application/json",
      resourceType: "fetch",
      contentSize: 124,
      transferSize: 340,
      responseBody: JSON.stringify({ id: "item-4", name: "New thing" }),
      startOffsetMs: 1080,
      blocked: 0.8,
      send: 0.3,
      wait: 92,
      receive: 2,
    }),
    e({
      url: "https://api.example.com/v1/items/item-4",
      mimeType: "application/json",
      method: "DELETE",
      resourceType: "fetch",
      status: 500,
      statusText: "Internal Server Error",
      contentSize: 88,
      transferSize: 320,
      responseBody: JSON.stringify({ error: "database_unavailable" }),
      startOffsetMs: 1180,
      blocked: 0.8,
      send: 0.3,
      wait: 1450,
      receive: 4,
    }),
    e({
      url: "https://api.example.com/v1/items?page=1",
      mimeType: "application/json",
      resourceType: "fetch",
      status: 304,
      statusText: "Not Modified",
      contentSize: 0,
      transferSize: 178,
      startOffsetMs: 2640,
      blocked: 0.7,
      send: 0.2,
      wait: 41,
      receive: 1,
    }),
  ];

  return {
    log: {
      version: "1.2",
      creator: CREATOR,
      entries,
    },
  };
}

function writeHar(name, har) {
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, name);
  writeFileSync(path, JSON.stringify(har, null, 2));
  console.log(`wrote ${path} (${har.log.entries.length} entries)`);
}

writeHar("news-site.har", buildNewsSite());
writeHar("api-debug.har", buildApiDebug());
