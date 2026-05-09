import { useState } from "react";
import type { ReactNode } from "react";
import type {
  HarCookie,
  HarHeader,
  HarPostData,
  HarQueryString,
  NormalizedEntry,
  NormalizedTimings,
} from "../types/har";
import { copyToClipboard, formatBytes, formatMs, formatTime } from "../lib/format";
import { DETAIL_COPY, WATERFALL_COPY } from "../lib/copy";
import { LAYOUT } from "../lib/layout";
import { HTTP_STATUS, statusSeverity } from "../lib/http";
import type { StatusSeverity } from "../lib/http";

// HAR spec encoding for binary response bodies (e.g. images, fonts).
const HAR_BASE64_ENCODING = "base64";

const SEVERITY_TONE: Record<StatusSeverity, string> = {
  err: "text-err",
  warn: "text-warn",
  redirect: "text-fg-muted",
  ok: "text-ok",
};

type TabKey = "headers" | "query" | "cookies" | "payload" | "response" | "timing";

interface Props {
  entry: NormalizedEntry;
  onClose: () => void;
}

interface TabDef {
  key: TabKey;
  label: string;
}

const TABS: readonly TabDef[] = [
  { key: "headers", label: DETAIL_COPY.tabs.headers },
  { key: "query", label: DETAIL_COPY.tabs.query },
  { key: "cookies", label: DETAIL_COPY.tabs.cookies },
  { key: "payload", label: DETAIL_COPY.tabs.payload },
  { key: "response", label: DETAIL_COPY.tabs.response },
  { key: "timing", label: DETAIL_COPY.tabs.timing },
];

interface TimingPhaseDef {
  key: keyof NormalizedTimings;
  label: string;
  barClass: string;
}

const TIMING_PHASES: readonly TimingPhaseDef[] = [
  { key: "blocked", label: WATERFALL_COPY.phases.blocked, barClass: "bg-t-blocked" },
  { key: "dns", label: WATERFALL_COPY.phases.dns, barClass: "bg-t-dns" },
  { key: "connect", label: WATERFALL_COPY.phases.connect, barClass: "bg-t-connect" },
  { key: "ssl", label: WATERFALL_COPY.phases.ssl, barClass: "bg-t-ssl" },
  { key: "send", label: WATERFALL_COPY.phases.send, barClass: "bg-t-send" },
  { key: "wait", label: WATERFALL_COPY.phases.wait, barClass: "bg-t-wait" },
  { key: "receive", label: WATERFALL_COPY.phases.receive, barClass: "bg-t-receive" },
];

export function RequestDetail({ entry, onClose }: Props) {
  const [tab, setTab] = useState<TabKey>("headers");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void copyToClipboard(entry.url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), LAYOUT.copiedResetMs);
    });
  };

  return (
    <div className="bg-panel border-l border-border h-full overflow-y-auto">
      <Header
        entry={entry}
        copied={copied}
        onCopy={handleCopy}
        onClose={onClose}
      />
      <TabStrip active={tab} onChange={setTab} />
      <div className="p-3">
        <TabPanel tab={tab} entry={entry} />
      </div>
    </div>
  );
}

interface HeaderProps {
  entry: NormalizedEntry;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}

function Header({ entry, copied, onCopy, onClose }: HeaderProps) {
  return (
    <div className="p-3 border-b border-border flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded border border-border text-fg">
            {entry.method}
          </span>
          <StatusBadge status={entry.status} statusText={entry.statusText} />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="text-xs px-2 py-1 rounded border border-border text-fg-muted hover:text-fg"
          >
            {copied ? DETAIL_COPY.copiedButton : DETAIL_COPY.copyButton}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-2 py-1 rounded border border-border text-fg-muted hover:text-fg"
          >
            {DETAIL_COPY.closeButton}
          </button>
        </div>
      </div>
      <div className="text-xs font-mono text-fg break-all select-all">
        {entry.url}
      </div>
      <div className="text-xs text-fg-muted">
        {(entry.httpVersion || DETAIL_COPY.unknown)} •{" "}
        {entry.serverIPAddress ?? DETAIL_COPY.unknown} •{" "}
        {entry.raw._resourceType ?? entry.category} • {DETAIL_COPY.startedPrefix}{" "}
        {formatTime(entry.startedAt)}
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: number;
  statusText: string;
}

function StatusBadge({ status, statusText }: StatusBadgeProps) {
  const tone = SEVERITY_TONE[statusSeverity(status)];
  const display = status === HTTP_STATUS.FETCH_ERROR ? DETAIL_COPY.errStatus : status;
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded border border-border ${tone}`}>
      {display} {statusText}
    </span>
  );
}

interface TabStripProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
}

function TabStrip({ active, onChange }: TabStripProps) {
  return (
    <div className="flex flex-row border-b border-border px-3">
      {TABS.map((t) => {
        const isActive = t.key === active;
        const cls = isActive
          ? "border-b-2 border-accent text-fg"
          : "text-fg-muted hover:text-fg border-b-2 border-transparent";
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`text-xs px-3 py-2 ${cls}`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps {
  tab: TabKey;
  entry: NormalizedEntry;
}

function TabPanel({ tab, entry }: TabPanelProps) {
  switch (tab) {
    case "headers":
      return (
        <HeadersTab
          requestHeaders={entry.raw.request.headers ?? []}
          responseHeaders={entry.raw.response.headers ?? []}
        />
      );
    case "query":
      return <QueryTab params={entry.raw.request.queryString ?? []} />;
    case "cookies":
      return (
        <CookiesTab
          requestCookies={entry.raw.request.cookies ?? []}
          responseCookies={entry.raw.response.cookies ?? []}
        />
      );
    case "payload":
      return <PayloadTab postData={entry.raw.request.postData} />;
    case "response":
      return <ResponseTab content={entry.raw.response.content} />;
    case "timing":
      return (
        <TimingTab
          timings={entry.timings}
          startedAt={entry.startedAt}
          endedAt={entry.endedAt}
        />
      );
  }
}

interface HeadersTabProps {
  requestHeaders: HarHeader[];
  responseHeaders: HarHeader[];
}

function HeadersTab({ requestHeaders, responseHeaders }: HeadersTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Section title={DETAIL_COPY.sections.requestHeaders}>
        {requestHeaders.length === 0 ? (
          <EmptyState>{DETAIL_COPY.empty.headers}</EmptyState>
        ) : (
          <KeyValueList items={requestHeaders.map((h) => ({ name: h.name, value: h.value }))} />
        )}
      </Section>
      <Section title={DETAIL_COPY.sections.responseHeaders}>
        {responseHeaders.length === 0 ? (
          <EmptyState>{DETAIL_COPY.empty.headers}</EmptyState>
        ) : (
          <KeyValueList items={responseHeaders.map((h) => ({ name: h.name, value: h.value }))} />
        )}
      </Section>
    </div>
  );
}

interface QueryTabProps {
  params: HarQueryString[];
}

function QueryTab({ params }: QueryTabProps) {
  if (params.length === 0) return <EmptyState>{DETAIL_COPY.empty.query}</EmptyState>;
  return (
    <KeyValueList items={params.map((p) => ({ name: p.name, value: p.value }))} />
  );
}

interface CookiesTabProps {
  requestCookies: HarCookie[];
  responseCookies: HarCookie[];
}

function CookiesTab({ requestCookies, responseCookies }: CookiesTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <Section title={DETAIL_COPY.sections.requestCookies}>
        {requestCookies.length === 0 ? (
          <EmptyState>{DETAIL_COPY.empty.requestCookies}</EmptyState>
        ) : (
          <CookieList cookies={requestCookies} />
        )}
      </Section>
      <Section title={DETAIL_COPY.sections.responseCookies}>
        {responseCookies.length === 0 ? (
          <EmptyState>{DETAIL_COPY.empty.responseCookies}</EmptyState>
        ) : (
          <CookieList cookies={responseCookies} />
        )}
      </Section>
    </div>
  );
}

interface CookieListProps {
  cookies: HarCookie[];
}

function CookieList({ cookies }: CookieListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {cookies.map((c, i) => {
        const truncated = c.value.length > LAYOUT.cookieValueTruncateChars;
        const display = truncated
          ? `${c.value.slice(0, LAYOUT.cookieValueTruncateChars)}…`
          : c.value;
        return (
          <li
            key={`${c.name}-${i}`}
            className="border border-border rounded p-2 flex flex-col gap-1"
          >
            <div className="text-xs font-mono text-fg break-all">
              <span className="text-fg-muted">{c.name}</span>
              <span className="text-fg-muted"> = </span>
              <span title={truncated ? c.value : undefined}>{display}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {c.domain ? <Chip>domain: {c.domain}</Chip> : null}
              {c.path ? <Chip>path: {c.path}</Chip> : null}
              {c.expires ? <Chip>expires: {c.expires}</Chip> : null}
              {c.httpOnly ? <Chip>httpOnly</Chip> : null}
              {c.secure ? <Chip>secure</Chip> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

interface PayloadTabProps {
  postData: HarPostData | undefined;
}

function PayloadTab({ postData }: PayloadTabProps) {
  if (!postData || (!postData.text && !postData.params?.length)) {
    return <EmptyState>{DETAIL_COPY.empty.payload}</EmptyState>;
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-fg-muted">
        {DETAIL_COPY.meta.mimeType}:{" "}
        <span className="font-mono text-fg">
          {postData.mimeType || DETAIL_COPY.unknown}
        </span>
      </div>
      {postData.params && postData.params.length > 0 ? (
        <KeyValueList
          items={postData.params.map((p) => ({ name: p.name, value: p.value ?? "" }))}
        />
      ) : null}
      {postData.text ? (
        <CodeBlock language={isJsonMime(postData.mimeType) ? "json" : "text"}>
          {prettyIfJson(postData.text, postData.mimeType)}
        </CodeBlock>
      ) : null}
    </div>
  );
}

interface ResponseTabProps {
  content: NormalizedEntry["raw"]["response"]["content"];
}

function ResponseTab({ content }: ResponseTabProps) {
  const meta = (
    <div className="text-xs text-fg-muted flex flex-wrap gap-x-4 gap-y-1">
      <span>
        {DETAIL_COPY.meta.mimeType}:{" "}
        <span className="font-mono text-fg">
          {content.mimeType || DETAIL_COPY.unknown}
        </span>
      </span>
      <span>
        {DETAIL_COPY.meta.size}:{" "}
        <span className="font-mono text-fg">{formatBytes(content.size)}</span>
      </span>
      {content.encoding ? (
        <span>
          {DETAIL_COPY.meta.encoding}:{" "}
          <span className="font-mono text-fg">{content.encoding}</span>
        </span>
      ) : null}
    </div>
  );

  if (content.text == null) {
    return (
      <div className="flex flex-col gap-2">
        {meta}
        <EmptyState>{DETAIL_COPY.empty.responseNotCaptured}</EmptyState>
      </div>
    );
  }

  if (content.encoding === HAR_BASE64_ENCODING) {
    // base64 bodies can be megabytes; only render a head slice to keep the DOM responsive.
    const preview = content.text.slice(0, LAYOUT.base64PreviewBytes);
    const truncated = content.text.length > LAYOUT.base64PreviewBytes;
    return (
      <div className="flex flex-col gap-2">
        {meta}
        <div className="text-xs text-warn">
          {DETAIL_COPY.base64Notice(LAYOUT.base64PreviewBytes, truncated)}
        </div>
        <CodeBlock language="text">{preview}</CodeBlock>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {meta}
      <CodeBlock language={isJsonMime(content.mimeType) ? "json" : "text"}>
        {prettyIfJson(content.text, content.mimeType)}
      </CodeBlock>
    </div>
  );
}

interface TimingTabProps {
  timings: NormalizedTimings;
  startedAt: number;
  endedAt: number;
}

function TimingTab({ timings, startedAt, endedAt }: TimingTabProps) {
  const total = timings.total > 0 ? timings.total : 1;
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1">
        {TIMING_PHASES.map((phase) => {
          const value = timings[phase.key];
          if (value <= 0) return null;
          const widthPct = Math.max((value / total) * 100, 1);
          return (
            <li
              key={phase.key}
              className="grid grid-cols-[7rem_4rem_1fr] items-center gap-2 text-xs"
            >
              <span className="text-fg-muted">{phase.label}</span>
              <span className="font-mono text-fg text-right">{formatMs(value)}</span>
              <div className="h-2 bg-bg rounded overflow-hidden">
                <div
                  className={`h-full ${phase.barClass}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="text-xs text-fg-muted pt-2 border-t border-border">
        {DETAIL_COPY.totalLabel}:{" "}
        <span className="font-mono text-fg">{formatMs(timings.total)}</span>
      </div>
      <div className="text-xs text-fg-muted">
        {DETAIL_COPY.startedPrefix}{" "}
        <span className="font-mono text-fg">{formatTime(startedAt)}</span> ·{" "}
        {DETAIL_COPY.endedPrefix}{" "}
        <span className="font-mono text-fg">{formatTime(endedAt)}</span>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs uppercase tracking-wide text-fg-muted">{title}</h3>
      {children}
    </div>
  );
}

interface KeyValueItem {
  name: string;
  value: string;
}

interface KeyValueListProps {
  items: KeyValueItem[];
}

function KeyValueList({ items }: KeyValueListProps) {
  return (
    <dl className="grid grid-cols-[minmax(8rem,12rem)_1fr] gap-x-3 gap-y-1 text-xs">
      {items.map((item, i) => (
        <div key={`${item.name}-${i}`} className="contents">
          <dt className="font-mono text-fg-muted break-all">{item.name}</dt>
          <dd className="font-mono text-fg break-all whitespace-pre-wrap">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface CodeBlockProps {
  language: "json" | "text";
  children: string;
}

function CodeBlock({ language, children }: CodeBlockProps) {
  return (
    <pre
      data-language={language}
      className={`bg-bg border border-border rounded p-2 text-xs font-mono text-fg overflow-auto whitespace-pre-wrap break-all ${LAYOUT.responseBodyMaxHeightClass}`}
    >
      {children}
    </pre>
  );
}

interface ChipProps {
  children: ReactNode;
}

function Chip({ children }: ChipProps) {
  return (
    <span className="text-xs font-mono px-1.5 py-0.5 rounded border border-border text-fg-muted">
      {children}
    </span>
  );
}

interface EmptyStateProps {
  children: ReactNode;
}

function EmptyState({ children }: EmptyStateProps) {
  return <div className="text-xs text-fg-muted italic">{children}</div>;
}

function isJsonMime(mime: string | undefined): boolean {
  if (!mime) return false;
  const lower = mime.toLowerCase();
  return lower.includes("json");
}

function prettyIfJson(text: string, mime: string | undefined): string {
  if (!isJsonMime(mime)) return text;
  try {
    const parsed: unknown = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return text;
  }
}
