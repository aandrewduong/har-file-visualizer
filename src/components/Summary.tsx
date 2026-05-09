import type { ParsedHar } from "../types/har";
import type { HarStats } from "../lib/stats";
import { formatBytes, formatMs } from "../lib/format";
import { SUMMARY_COPY } from "../lib/copy";
import { LAYOUT } from "../lib/layout";

interface Props {
  parsed: ParsedHar;
  stats: HarStats;
  fileName: string;
  onReset: () => void;
}

interface StatTile {
  label: string;
  value: string;
}

interface StatusSegment {
  label: string;
  count: number;
  colorClass: string;
}

function statusSegmentColor(label: string): string {
  switch (label) {
    case "2xx":
      return "bg-ok";
    case "3xx":
      return "bg-fg-muted";
    case "4xx":
      return "bg-warn";
    case "5xx":
      return "bg-err";
    default:
      return "bg-border";
  }
}

export function Summary({ parsed, stats, fileName, onReset }: Props) {
  const tiles: StatTile[] = [
    { label: SUMMARY_COPY.tiles.requests, value: String(stats.totalRequests) },
    {
      label: SUMMARY_COPY.tiles.transferred,
      value: formatBytes(stats.totalTransferBytes),
    },
    {
      label: SUMMARY_COPY.tiles.resources,
      value: formatBytes(stats.totalResourceBytes),
    },
    { label: SUMMARY_COPY.tiles.wallClock, value: formatMs(stats.wallClockMs) },
    { label: SUMMARY_COPY.tiles.cached, value: String(stats.cachedCount) },
    { label: SUMMARY_COPY.tiles.errors, value: String(stats.errorCount) },
  ];

  const segments: StatusSegment[] = stats.statusBuckets.map((b) => ({
    label: b.label,
    count: b.count,
    colorClass: statusSegmentColor(b.label),
  }));

  const segmentTotal = segments.reduce((sum, s) => sum + s.count, 0);
  const topCategories = stats.byCategory.slice(0, LAYOUT.topCategoryCount);
  const creator = parsed.file.log.creator;

  return (
    <section className="bg-panel border-b border-border px-4 py-3 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col">
          <span className="text-sm text-fg font-medium">{fileName}</span>
          <span className="text-xs text-fg-muted">
            {creator
              ? `${creator.name} ${creator.version}`
              : SUMMARY_COPY.unknownCreator}
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-accent hover:underline px-2 py-1 rounded border border-border bg-panel-2"
        >
          {SUMMARY_COPY.resetButton}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded border border-border bg-panel-2 px-3 py-2"
          >
            <div className="text-[10px] uppercase tracking-wide text-fg-muted">
              {tile.label}
            </div>
            <div className="text-base text-fg font-semibold">{tile.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-[10px] uppercase tracking-wide text-fg-muted">
          {SUMMARY_COPY.statusHeading}
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded bg-panel-2 border border-border">
          {segmentTotal === 0 ? null : (
            segments.map((seg) => {
              if (seg.count === 0) return null;
              const widthPct = (seg.count / segmentTotal) * 100;
              return (
                <div
                  key={seg.label}
                  className={seg.colorClass}
                  style={{ width: `${widthPct}%` }}
                  title={`${seg.label}: ${seg.count}`}
                />
              );
            })
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-fg-muted">
          {segments.map((seg) => (
            <span key={seg.label} className="inline-flex items-center gap-1">
              <span
                aria-hidden="true"
                className={`inline-block h-2 w-2 rounded-sm ${seg.colorClass}`}
              />
              <span className="text-fg">{seg.label}</span>
              <span>{seg.count}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-[10px] uppercase tracking-wide text-fg-muted">
          {SUMMARY_COPY.byTypeHeading}
        </div>
        <table className="w-full text-xs">
          <thead className="text-fg-muted">
            <tr>
              <th className="text-left font-normal py-1 pr-2">
                {SUMMARY_COPY.byTypeColumns.category}
              </th>
              <th className="text-right font-normal py-1 px-2">
                {SUMMARY_COPY.byTypeColumns.count}
              </th>
              <th className="text-right font-normal py-1 pl-2">
                {SUMMARY_COPY.byTypeColumns.bytes}
              </th>
            </tr>
          </thead>
          <tbody>
            {topCategories.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="py-1 text-fg-muted italic text-center"
                >
                  {SUMMARY_COPY.noRequests}
                </td>
              </tr>
            ) : (
              topCategories.map((row) => (
                <tr
                  key={row.category}
                  className="border-t border-border/60"
                >
                  <td className="py-1 pr-2 text-fg">{row.category}</td>
                  <td className="py-1 px-2 text-right text-fg">{row.count}</td>
                  <td className="py-1 pl-2 text-right text-fg-muted">
                    {formatBytes(row.bytes)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
