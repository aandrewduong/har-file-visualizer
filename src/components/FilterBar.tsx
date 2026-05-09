import type { ChangeEvent } from "react";
import type { ParsedHar, RequestCategory } from "../types/har";
import type { FilterState, StatusBucket } from "../lib/filter";
import {
  initialFilters,
  uniqueCategories,
  uniqueMethods,
} from "../lib/filter";
import { FILTER_COPY } from "../lib/copy";
import { LAYOUT, searchInputStyle } from "../lib/layout";

interface Props {
  parsed: ParsedHar;
  filters: FilterState;
  onChange: (next: FilterState) => void;
  visibleCount: number;
  totalCount: number;
}

const STATUS_BUCKETS: readonly StatusBucket[] = [
  "all",
  "2xx",
  "3xx",
  "4xx",
  "5xx",
  "other",
];

const inputClass =
  "bg-panel-2 border border-border rounded px-2 py-1 text-fg focus:outline-none focus:border-accent";

function shortenTitle(title: string, max: number): string {
  if (title.length <= max) return title;
  return `${title.slice(0, max - 1)}…`;
}

function isStatusBucket(value: string): value is StatusBucket {
  return STATUS_BUCKETS.some((b) => b === value);
}

function isRequestCategoryOrAll(
  value: string,
  categories: RequestCategory[],
): value is RequestCategory | "all" {
  if (value === "all") return true;
  return categories.some((c) => c === value);
}

export function FilterBar({
  parsed,
  filters,
  onChange,
  visibleCount,
  totalCount,
}: Props) {
  const methods = uniqueMethods(parsed.entries);
  const categories = uniqueCategories(parsed.entries);

  const update = (patch: Partial<FilterState>) => {
    onChange({ ...filters, ...patch });
  };

  const onSearch = (e: ChangeEvent<HTMLInputElement>) =>
    update({ search: e.target.value });

  const onPage = (e: ChangeEvent<HTMLSelectElement>) =>
    update({ pageref: e.target.value });

  const onMethod = (e: ChangeEvent<HTMLSelectElement>) =>
    update({ method: e.target.value });

  const onCategory = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (isRequestCategoryOrAll(value, categories)) {
      update({ category: value });
    }
  };

  const onStatus = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (isStatusBucket(value)) {
      update({ status: value });
    }
  };

  const onHideCached = (e: ChangeEvent<HTMLInputElement>) =>
    update({ hideCached: e.target.checked });

  const onClear = () => onChange(initialFilters);

  return (
    <div className="bg-panel border-b border-border px-4 py-2 flex flex-wrap gap-2 items-center text-xs">
      <input
        type="search"
        value={filters.search}
        onChange={onSearch}
        placeholder={FILTER_COPY.searchPlaceholder}
        className={`${inputClass} flex-1`}
        style={searchInputStyle}
        aria-label={FILTER_COPY.searchPlaceholder}
      />

      <label className="flex items-center gap-1">
        <span className="text-fg-muted">{FILTER_COPY.pageLabel}</span>
        <select
          value={filters.pageref}
          onChange={onPage}
          className={inputClass}
        >
          <option value="all">{FILTER_COPY.allPages}</option>
          {parsed.pages.map((p) => (
            <option key={p.id} value={p.id}>
              {shortenTitle(p.title, LAYOUT.pageTitleMaxChars)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1">
        <span className="text-fg-muted">{FILTER_COPY.methodLabel}</span>
        <select
          value={filters.method}
          onChange={onMethod}
          className={inputClass}
        >
          <option value="all">{FILTER_COPY.all}</option>
          {methods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1">
        <span className="text-fg-muted">{FILTER_COPY.typeLabel}</span>
        <select
          value={filters.category}
          onChange={onCategory}
          className={inputClass}
        >
          <option value="all">{FILTER_COPY.all}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1">
        <span className="text-fg-muted">{FILTER_COPY.statusLabel}</span>
        <select
          value={filters.status}
          onChange={onStatus}
          className={inputClass}
        >
          {STATUS_BUCKETS.map((b) => (
            <option key={b} value={b}>
              {b === "all" ? FILTER_COPY.all : b}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1 text-fg-muted cursor-pointer">
        <input
          type="checkbox"
          checked={filters.hideCached}
          onChange={onHideCached}
          className="accent-accent"
        />
        <span>{FILTER_COPY.hideCached}</span>
      </label>

      <button
        type="button"
        onClick={onClear}
        className="border border-border bg-panel-2 rounded px-2 py-1 text-fg-muted hover:text-fg hover:border-accent"
      >
        {FILTER_COPY.clear}
      </button>

      <span className="ml-auto text-fg-muted">
        {FILTER_COPY.count(visibleCount, totalCount)}
      </span>
    </div>
  );
}
