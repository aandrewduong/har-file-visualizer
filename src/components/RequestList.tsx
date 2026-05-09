import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { NormalizedEntry } from "../types/har";
import type { SortKey, SortState } from "../lib/filter";
import { applySort } from "../lib/filter";
import {
  formatBytes,
  formatMs,
  formatTime,
  statusColor,
} from "../lib/format";
import { REQUEST_LIST_COPY } from "../lib/copy";

interface Props {
  entries: NormalizedEntry[];
  sort: SortState;
  onSortChange: (next: SortState) => void;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

interface ColumnDef {
  key: SortKey;
  label: string;
  className: string;
}

const COLUMNS: ColumnDef[] = [
  { key: "status", label: REQUEST_LIST_COPY.columns.status, className: "w-16 shrink-0" },
  { key: "method", label: REQUEST_LIST_COPY.columns.method, className: "w-16 shrink-0" },
  { key: "host", label: REQUEST_LIST_COPY.columns.host, className: "w-48 shrink-0" },
  { key: "path", label: REQUEST_LIST_COPY.columns.path, className: "flex-1 min-w-0" },
  { key: "category", label: REQUEST_LIST_COPY.columns.type, className: "w-24 shrink-0" },
  { key: "transferSize", label: REQUEST_LIST_COPY.columns.size, className: "w-20 shrink-0 text-right" },
  { key: "duration", label: REQUEST_LIST_COPY.columns.time, className: "w-20 shrink-0 text-right" },
  { key: "startedAt", label: REQUEST_LIST_COPY.columns.started, className: "w-28 shrink-0 text-right" },
];

const TRUNCATE_CLASS = "text-ellipsis overflow-hidden whitespace-nowrap";

export function RequestList({
  entries,
  sort,
  onSortChange,
  selectedId,
  onSelect,
}: Props) {
  const sorted = useMemo(() => applySort(entries, sort), [entries, sort]);

  const handleHeaderClick = (key: SortKey) => {
    if (sort.key === key) {
      onSortChange({ key, dir: sort.dir === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ key, dir: "asc" });
    }
  };

  return (
    <div
      role="grid"
      className="h-full w-full overflow-auto bg-panel text-xs text-fg"
    >
      <div
        role="row"
        className="sticky top-0 z-10 flex border-b border-border bg-panel-2 font-medium text-fg-muted"
      >
        {COLUMNS.map((col) => {
          const isActive = sort.key === col.key;
          const arrow = isActive ? (sort.dir === "asc" ? " ▲" : " ▼") : "";
          return (
            <button
              key={col.key}
              type="button"
              role="columnheader"
              aria-sort={
                isActive
                  ? sort.dir === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
              }
              onClick={() => handleHeaderClick(col.key)}
              className={`${col.className} px-2 py-1 text-left hover:text-fg transition-colors ${
                isActive ? "text-accent" : ""
              }`}
            >
              {col.label}
              {arrow}
            </button>
          );
        })}
      </div>

      {sorted.map((entry) => {
        const isSelected = entry.id === selectedId;
        const rowClass = isSelected
          ? "bg-panel-2 border-l-2 border-l-accent"
          : "border-l-2 border-l-transparent hover:bg-panel-2";
        const badgeStyle: CSSProperties = {
          color: statusColor(entry.status),
        };
        return (
          <div
            key={entry.id}
            role="row"
            aria-selected={isSelected}
            onClick={() => onSelect(entry.id)}
            className={`flex border-b border-border cursor-pointer ${rowClass}`}
          >
            <div className={`${COLUMNS[0].className} px-2 py-1`}>
              <span
                className="inline-block rounded px-1 font-mono font-medium"
                style={badgeStyle}
              >
                {entry.status || REQUEST_LIST_COPY.errBadge}
              </span>
            </div>
            <div className={`${COLUMNS[1].className} px-2 py-1 font-mono`}>
              {entry.method}
            </div>
            <div
              className={`${COLUMNS[2].className} px-2 py-1 ${TRUNCATE_CLASS} text-fg-muted`}
              title={entry.host}
            >
              {entry.host}
            </div>
            <div
              className={`${COLUMNS[3].className} px-2 py-1 ${TRUNCATE_CLASS}`}
              title={entry.path}
            >
              {entry.path}
            </div>
            <div className={`${COLUMNS[4].className} px-2 py-1 text-fg-muted`}>
              {entry.category}
            </div>
            <div className={`${COLUMNS[5].className} px-2 py-1 font-mono text-fg-muted`}>
              {formatBytes(entry.transferSize)}
            </div>
            <div className={`${COLUMNS[6].className} px-2 py-1 font-mono text-fg-muted`}>
              {formatMs(entry.duration)}
            </div>
            <div className={`${COLUMNS[7].className} px-2 py-1 font-mono text-fg-muted`}>
              {formatTime(entry.startedAt)}
            </div>
          </div>
        );
      })}

      {sorted.length === 0 ? (
        <div className="px-3 py-6 text-center text-fg-muted">
          {REQUEST_LIST_COPY.empty}
        </div>
      ) : null}
    </div>
  );
}
