// HAR 1.2 spec types — http://www.softwareishard.com/blog/har-12-spec/
// Only the fields we actually read are typed. Anything we don't model is
// preserved on the raw object for the JSON viewer to surface.

export interface HarFile {
  log: HarLog;
}

export interface HarLog {
  version: string;
  creator?: HarCreator;
  browser?: HarCreator;
  pages?: HarPage[];
  entries: HarEntry[];
  comment?: string;
}

export interface HarCreator {
  name: string;
  version: string;
  comment?: string;
}

export interface HarPage {
  startedDateTime: string;
  id: string;
  title: string;
  pageTimings: HarPageTimings;
  comment?: string;
}

export interface HarPageTimings {
  onContentLoad?: number;
  onLoad?: number;
  comment?: string;
}

export interface HarEntry {
  pageref?: string;
  startedDateTime: string;
  time: number;
  request: HarRequest;
  response: HarResponse;
  cache: HarCache;
  timings: HarTimings;
  serverIPAddress?: string;
  connection?: string;
  comment?: string;
  // Chrome-specific extensions we surface in the UI
  _resourceType?: string;
  _initiator?: HarInitiator;
  _priority?: string;
  _connectionId?: string;
}

export interface HarRequest {
  method: string;
  url: string;
  httpVersion: string;
  cookies: HarCookie[];
  headers: HarHeader[];
  queryString: HarQueryString[];
  postData?: HarPostData;
  headersSize: number;
  bodySize: number;
  comment?: string;
}

export interface HarResponse {
  status: number;
  statusText: string;
  httpVersion: string;
  cookies: HarCookie[];
  headers: HarHeader[];
  content: HarContent;
  redirectURL: string;
  headersSize: number;
  bodySize: number;
  comment?: string;
  _transferSize?: number;
  _error?: string | null;
}

export interface HarHeader {
  name: string;
  value: string;
  comment?: string;
}

export interface HarCookie {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  expires?: string | null;
  httpOnly?: boolean;
  secure?: boolean;
  comment?: string;
}

export interface HarQueryString {
  name: string;
  value: string;
  comment?: string;
}

export interface HarPostData {
  mimeType: string;
  params?: HarParam[];
  text?: string;
  comment?: string;
}

export interface HarParam {
  name: string;
  value?: string;
  fileName?: string;
  contentType?: string;
  comment?: string;
}

export interface HarContent {
  size: number;
  compression?: number;
  mimeType: string;
  text?: string;
  encoding?: string;
  comment?: string;
}

export interface HarCache {
  beforeRequest?: HarCacheState | null;
  afterRequest?: HarCacheState | null;
  comment?: string;
}

export interface HarCacheState {
  expires?: string;
  lastAccess: string;
  eTag: string;
  hitCount: number;
  comment?: string;
}

// Per HAR spec, any of dns/connect/ssl/blocked may be -1 to indicate "n/a".
// `send`, `wait`, `receive` are required and >= 0.
export interface HarTimings {
  blocked?: number;
  dns?: number;
  connect?: number;
  send: number;
  wait: number;
  receive: number;
  ssl?: number;
  comment?: string;
}

export interface HarInitiator {
  type: string;
  url?: string;
  lineNumber?: number;
  stack?: unknown;
}

// ---------------------------------------------------------------------------
// Normalized shape used throughout the app. We compute these once on parse so
// rendering paths don't have to keep re-deriving them.

export type RequestCategory =
  | "document"
  | "stylesheet"
  | "script"
  | "image"
  | "font"
  | "xhr"
  | "fetch"
  | "media"
  | "websocket"
  | "manifest"
  | "other";

export interface NormalizedEntry {
  /** Stable index into the original entries array — also the React key. */
  id: number;
  raw: HarEntry;

  startedAt: number; // epoch ms
  endedAt: number; // epoch ms
  duration: number; // ms

  method: string;
  url: string;
  host: string;
  path: string;
  status: number;
  statusText: string;
  httpVersion: string;

  mimeType: string;
  category: RequestCategory;

  /** Bytes transferred over the wire when known, falling back to body size. */
  transferSize: number;
  /** Decoded response body size. */
  resourceSize: number;

  pageref?: string;

  /** Phase durations in ms with -1/undefined coalesced to 0 for charting. */
  timings: NormalizedTimings;

  initiatorUrl?: string;
  serverIPAddress?: string;
  hasError: boolean;
  fromCache: boolean;
}

export interface NormalizedTimings {
  blocked: number;
  dns: number;
  connect: number;
  ssl: number;
  send: number;
  wait: number;
  receive: number;
  total: number;
}

export interface ParsedHar {
  file: HarFile;
  entries: NormalizedEntry[];
  pages: HarPage[];
  /** Earliest startedDateTime across entries, in epoch ms. */
  startedAt: number;
  /** Latest endedAt across entries, in epoch ms. */
  endedAt: number;
  /** O(1) lookup from NormalizedEntry.id to entry. */
  entryById: Map<number, NormalizedEntry>;
  /** Sorted, deduped HTTP methods present in the file (for filter UI). */
  methods: string[];
  /** Sorted, deduped categories present in the file (for filter UI). */
  categories: RequestCategory[];
}
