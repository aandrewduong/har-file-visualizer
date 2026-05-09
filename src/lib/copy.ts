// Single source of UI strings. Keep components free of inline copy so they
// stay reusable and easier to localize later if needed.

import { formatBytes } from "./format";

export const APP_COPY = {
  title: "HAR file visualizer",
  subtitle:
    "Inspect HTTP Archive (.har) files exported from your browser's DevTools.",
  unknownLoadError: "Failed to read file.",
} as const;

export const EXAMPLES_COPY = {
  heading: "No HAR handy? Try an example",
  fetchFailed: (label: string, status: number) =>
    `Could not load "${label}" (HTTP ${status}).`,
  fetchUnknownError: (label: string) => `Could not load "${label}".`,
} as const;

export const SPLITTER_COPY = {
  ariaLabelList: "Resize request list",
  ariaLabelDetail: "Resize detail panel",
} as const;

export const DROPZONE_COPY = {
  cta: "Drop a HAR file here, or click to choose",
  empty: "No file selected",
  parsing: (name: string) => `Parsing ${name}…`,
  fileFallback: "file",
  whatIsHeading: "What is a HAR file?",
  whatIsBody:
    "An HTTP Archive is a JSON log of network requests captured by your browser's DevTools (Network tab → Save all as HAR).",
  privacy:
    "Everything is parsed locally in your browser — nothing is uploaded.",
  searchAriaLabel: "Search requests",
} as const;

export const SUMMARY_COPY = {
  unknownCreator: "Unknown creator",
  resetButton: "Load another file",
  tiles: {
    requests: "Requests",
    transferred: "Transferred",
    resources: "Resources",
    wallClock: "Wall clock",
    cached: "Cached",
    errors: "Errors",
  },
  statusHeading: "Status codes",
  byTypeHeading: "By type",
  byTypeColumns: {
    category: "Category",
    count: "Count",
    bytes: "Bytes",
  },
  noRequests: "No requests",
} as const;

export const FILTER_COPY = {
  searchPlaceholder: "Search url, method, status, mime…",
  pageLabel: "Page",
  allPages: "All pages",
  methodLabel: "Method",
  typeLabel: "Type",
  statusLabel: "Status",
  hideCached: "Hide cached",
  clear: "Clear filters",
  all: "All",
  count: (visible: number, total: number) => `${visible} of ${total} requests`,
} as const;

export const REQUEST_LIST_COPY = {
  columns: {
    status: "Status",
    method: "Method",
    host: "Host",
    path: "Path",
    type: "Type",
    size: "Size",
    time: "Time",
    started: "Started",
  },
  empty: "No requests to display.",
  errBadge: "—",
} as const;

export const WATERFALL_COPY = {
  phases: {
    blocked: "Blocked",
    dns: "DNS",
    connect: "Connect",
    ssl: "SSL",
    send: "Send",
    wait: "Wait",
    receive: "Receive",
  },
  empty: "No requests to display.",
  total: "Total",
} as const;

export const DETAIL_COPY = {
  copyButton: "Copy URL",
  copiedButton: "Copied",
  closeButton: "Close",
  errStatus: "ERR",
  unknown: "—",
  startedPrefix: "Started",
  endedPrefix: "Ended",
  totalLabel: "Total",
  tabs: {
    headers: "Headers",
    query: "Query",
    cookies: "Cookies",
    payload: "Payload",
    response: "Response",
    timing: "Timing",
  },
  sections: {
    requestHeaders: "Request headers",
    responseHeaders: "Response headers",
    requestCookies: "Request cookies",
    responseCookies: "Response cookies",
  },
  empty: {
    headers: "No headers.",
    query: "No query parameters.",
    requestCookies: "No request cookies.",
    responseCookies: "No response cookies.",
    payload: "No request body.",
    responseNotCaptured: "Response body not captured.",
  },
  meta: {
    mimeType: "mimeType",
    size: "size",
    encoding: "encoding",
  },
  base64Notice: (previewBytes: number, truncated: boolean) =>
    `Body is base64-encoded. Showing the first ${formatBytes(previewBytes)}${
      truncated ? " (truncated)." : "."
    }`,
} as const;
