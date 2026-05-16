import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileDropzone } from "./components/FileDropzone";
import { Summary } from "./components/Summary";
import { FilterBar } from "./components/FilterBar";
import { RequestList } from "./components/RequestList";
import { Waterfall } from "./components/Waterfall";
import { RequestDetail } from "./components/RequestDetail";
import { Splitter } from "./components/Splitter";
import type { ParsedHar } from "./types/har";
import { HarParseError, parseHarText } from "./lib/har-parser";
import {
  applyFilters,
  applySort,
  initialFilters,
  initialSort,
} from "./lib/filter";
import type { FilterState, SortState } from "./lib/filter";
import { computeStats } from "./lib/stats";
import { LAYOUT, STORAGE_KEYS } from "./lib/layout";
import { readNumber, writeNumber } from "./lib/storage";
import { APP_COPY, EXAMPLES_COPY, SPLITTER_COPY } from "./lib/copy";
import { exampleUrl } from "./lib/examples";
import type { Example } from "./lib/examples";

interface LoadedFile {
  parsed: ParsedHar;
  fileName: string;
}

export default function App() {
  const [loaded, setLoaded] = useState<LoadedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sort, setSort] = useState<SortState>(initialSort);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleLoad = async (text: string, fileName: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Yield to the browser so the spinner paints before JSON.parse blocks
      // the main thread on multi-megabyte HARs.
      await new Promise((r) => setTimeout(r, 0));
      const parsed = parseHarText(text);
      setLoaded({ parsed, fileName });
      setFilters(initialFilters);
      setSort(initialSort);
      setSelectedId(null);
    } catch (err) {
      const message =
        err instanceof HarParseError
          ? err.message
          : err instanceof Error
            ? err.message
            : APP_COPY.unknownLoadError;
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setLoaded(null);
    setErrorMessage(null);
    setFilters(initialFilters);
    setSort(initialSort);
    setSelectedId(null);
  };

  const handleLoadExample = async (example: Example) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(exampleUrl(example.fileName));
      if (!res.ok) {
        throw new Error(EXAMPLES_COPY.fetchFailed(example.label, res.status));
      }
      const text = await res.text();
      // Hand off to the same parse path used for user-uploaded files.
      await handleLoad(text, example.label);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : EXAMPLES_COPY.fetchUnknownError(example.label);
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  if (!loaded) {
    return (
      <FileDropzone
        onLoad={handleLoad}
        onLoadExample={handleLoadExample}
        isLoading={isLoading}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <Workspace
      loaded={loaded}
      filters={filters}
      onFiltersChange={setFilters}
      sort={sort}
      onSortChange={setSort}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onReset={handleReset}
    />
  );
}

interface WorkspaceProps {
  loaded: LoadedFile;
  filters: FilterState;
  onFiltersChange: (next: FilterState) => void;
  sort: SortState;
  onSortChange: (next: SortState) => void;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onReset: () => void;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function Workspace({
  loaded,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  selectedId,
  onSelect,
  onReset,
}: WorkspaceProps) {
  const { parsed, fileName } = loaded;

  const stats = useMemo(() => computeStats(parsed), [parsed]);

  const filtered = useMemo(
    () => applyFilters(parsed.entries, filters),
    [parsed.entries, filters],
  );

  const sorted = useMemo(() => applySort(filtered, sort), [filtered, sort]);

  const selectedEntry = useMemo(() => {
    if (selectedId == null) return null;
    return parsed.entryById.get(selectedId) ?? null;
  }, [parsed.entryById, selectedId]);

  const windowMs = parsed.endedAt - parsed.startedAt;

  const splitRowRef = useRef<HTMLDivElement>(null);
  const detailRowRef = useRef<HTMLDivElement>(null);

  const [listWidth, setListWidth] = useState(() =>
    readNumber(STORAGE_KEYS.listWidth, LAYOUT.resize.listDefaultPx),
  );
  const [detailWidth, setDetailWidth] = useState(() =>
    readNumber(STORAGE_KEYS.detailWidth, LAYOUT.resize.detailDefaultPx),
  );

  useEffect(() => {
    writeNumber(STORAGE_KEYS.listWidth, listWidth);
  }, [listWidth]);
  useEffect(() => {
    writeNumber(STORAGE_KEYS.detailWidth, detailWidth);
  }, [detailWidth]);

  // Keep widths inside the current container bounds (e.g. window resize, or
  // after the detail panel opens and shrinks the available space).
  useEffect(() => {
    const reclamp = () => {
      const splitRect = splitRowRef.current?.getBoundingClientRect();
      if (splitRect) {
        const max = Math.max(
          LAYOUT.resize.listMinPx,
          splitRect.width - LAYOUT.resize.waterfallMinPx,
        );
        setListWidth((w) => clamp(w, LAYOUT.resize.listMinPx, max));
      }
      const detailRect = detailRowRef.current?.getBoundingClientRect();
      if (detailRect) {
        const max = Math.max(
          LAYOUT.resize.detailMinPx,
          detailRect.width * LAYOUT.resize.detailMaxRatio,
        );
        setDetailWidth((w) => clamp(w, LAYOUT.resize.detailMinPx, max));
      }
    };
    reclamp();
    window.addEventListener("resize", reclamp);
    return () => window.removeEventListener("resize", reclamp);
  }, [selectedEntry]);

  const handleListDrag = useCallback((clientX: number) => {
    const rect = splitRowRef.current?.getBoundingClientRect();
    if (!rect) return;
    const max = Math.max(
      LAYOUT.resize.listMinPx,
      rect.width - LAYOUT.resize.waterfallMinPx,
    );
    setListWidth(clamp(clientX - rect.left, LAYOUT.resize.listMinPx, max));
  }, []);

  const handleDetailDrag = useCallback((clientX: number) => {
    const rect = detailRowRef.current?.getBoundingClientRect();
    if (!rect) return;
    const max = Math.max(
      LAYOUT.resize.detailMinPx,
      rect.width * LAYOUT.resize.detailMaxRatio,
    );
    setDetailWidth(clamp(rect.right - clientX, LAYOUT.resize.detailMinPx, max));
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col bg-bg text-fg">
      <Summary
        parsed={parsed}
        stats={stats}
        fileName={fileName}
        onReset={onReset}
      />
      <FilterBar
        parsed={parsed}
        filters={filters}
        onChange={onFiltersChange}
        visibleCount={filtered.length}
        totalCount={parsed.entries.length}
      />

      <div ref={detailRowRef} className="flex min-h-0 flex-1">
        <div
          ref={splitRowRef}
          className="flex min-w-0 flex-1 flex-col"
        >
          <div className="flex min-h-0 flex-1">
            <div
              className="min-w-0 shrink-0"
              style={{ width: `${listWidth}px` }}
            >
              <RequestList
                entries={sorted}
                sort={sort}
                onSortChange={onSortChange}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            </div>
            <Splitter
              onDrag={handleListDrag}
              ariaLabel={SPLITTER_COPY.ariaLabelList}
            />
            <div className="min-w-0 flex-1">
              <Waterfall
                entries={sorted}
                windowStartMs={parsed.startedAt}
                windowMs={windowMs}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            </div>
          </div>
        </div>

        {selectedEntry ? (
          <>
            <Splitter
              onDrag={handleDetailDrag}
              ariaLabel={SPLITTER_COPY.ariaLabelDetail}
            />
            <aside
              className="shrink-0 min-w-0"
              style={{ width: `${detailWidth}px` }}
            >
              <RequestDetail
                entry={selectedEntry}
                onClose={() => onSelect(null)}
              />
            </aside>
          </>
        ) : null}
      </div>
    </div>
  );
}
