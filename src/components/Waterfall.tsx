import type { CSSProperties } from "react";
import type { NormalizedEntry, NormalizedTimings } from "../types/har";
import { formatMs } from "../lib/format";
import { WATERFALL_COPY } from "../lib/copy";

interface Props {
  entries: NormalizedEntry[];
  windowStartMs: number;
  windowMs: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

type PhaseKey = "blocked" | "dns" | "connect" | "ssl" | "send" | "wait" | "receive";

interface PhaseDef {
  key: PhaseKey;
  label: string;
  bgClass: string;
}

const PHASES: PhaseDef[] = [
  { key: "blocked", label: WATERFALL_COPY.phases.blocked, bgClass: "bg-t-blocked" },
  { key: "dns", label: WATERFALL_COPY.phases.dns, bgClass: "bg-t-dns" },
  { key: "connect", label: WATERFALL_COPY.phases.connect, bgClass: "bg-t-connect" },
  { key: "ssl", label: WATERFALL_COPY.phases.ssl, bgClass: "bg-t-ssl" },
  { key: "send", label: WATERFALL_COPY.phases.send, bgClass: "bg-t-send" },
  { key: "wait", label: WATERFALL_COPY.phases.wait, bgClass: "bg-t-wait" },
  { key: "receive", label: WATERFALL_COPY.phases.receive, bgClass: "bg-t-receive" },
];

const TICK_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];
const ROW_HEIGHT_CLASS = "h-5";

function buildTooltip(entry: NormalizedEntry): string {
  const t = entry.timings;
  const parts = PHASES.map((p) => `${p.label}: ${formatMs(t[p.key])}`);
  return `${entry.method} ${entry.url}\n${parts.join(" | ")}\n${WATERFALL_COPY.total}: ${formatMs(entry.duration)}`;
}

function sumPhases(t: NormalizedTimings): number {
  return t.blocked + t.dns + t.connect + t.ssl + t.send + t.wait + t.receive;
}

export function Waterfall({
  entries,
  windowStartMs,
  windowMs,
  selectedId,
  onSelect,
}: Props) {
  // windowMs may be 0 when the file has no entries or all entries share a
  // single instant — guard percentage math against div/0.
  const safeWindow = windowMs > 0 ? windowMs : 1;

  return (
    <div className="flex h-full w-full flex-col bg-panel text-xs text-fg">
      <div className="relative h-6 shrink-0 border-b border-border bg-panel-2">
        {TICK_FRACTIONS.map((frac) => {
          const tickStyle: CSSProperties = {
            left: `${frac * 100}%`,
            transform:
              frac === 0
                ? "translateX(0)"
                : frac === 1
                  ? "translateX(-100%)"
                  : "translateX(-50%)",
          };
          return (
            <div
              key={frac}
              className="absolute top-0 flex h-full items-center px-1 font-mono text-[10px] text-fg-muted"
              style={tickStyle}
            >
              {formatMs(frac * windowMs)}
            </div>
          );
        })}
      </div>

      <div className="relative flex-1 overflow-auto">
        {TICK_FRACTIONS.map((frac) => (
          <div
            key={frac}
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 border-l border-border/40"
            style={{ left: `${frac * 100}%` }}
          />
        ))}

        {entries.map((entry) => {
          const isSelected = entry.id === selectedId;
          const offsetMs = entry.startedAt - windowStartMs;
          const leftPct = (offsetMs / safeWindow) * 100;
          const phaseTotal = sumPhases(entry.timings);
          // Prefer summed phase widths, but clamp so a row never overflows
          // the visible window if a HAR's `time` field disagrees with phases.
          const totalMs = phaseTotal > 0 ? phaseTotal : entry.duration;
          const rowClass = isSelected
            ? "bg-panel-2"
            : "hover:bg-panel-2/60";

          return (
            <div
              key={entry.id}
              role="row"
              aria-selected={isSelected}
              onClick={() => onSelect(entry.id)}
              title={buildTooltip(entry)}
              className={`relative ${ROW_HEIGHT_CLASS} cursor-pointer border-b border-border ${rowClass}`}
            >
              <div
                className="absolute top-1/2 h-3 -translate-y-1/2"
                style={{
                  left: `${leftPct}%`,
                  width: `${(totalMs / safeWindow) * 100}%`,
                  minWidth: "1px",
                }}
              >
                <div className="relative h-full w-full">
                  {(() => {
                    let cursor = 0;
                    return PHASES.map((p) => {
                      const ms = entry.timings[p.key];
                      if (ms <= 0) return null;
                      const segLeftPct = (cursor / totalMs) * 100;
                      const segWidthPct = (ms / totalMs) * 100;
                      cursor += ms;
                      return (
                        <div
                          key={p.key}
                          className={`absolute top-0 h-full ${p.bgClass}`}
                          style={{
                            left: `${segLeftPct}%`,
                            width: `${segWidthPct}%`,
                          }}
                        />
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          );
        })}

        {entries.length === 0 ? (
          <div className="px-3 py-6 text-center text-fg-muted">
            {WATERFALL_COPY.empty}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap gap-x-3 gap-y-1 border-t border-border bg-panel-2 px-2 py-1 text-[10px] text-fg-muted">
        {PHASES.map((p) => (
          <div key={p.key} className="flex items-center gap-1">
            <span
              aria-hidden="true"
              className={`inline-block h-2 w-3 rounded-sm ${p.bgClass}`}
            />
            <span>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
