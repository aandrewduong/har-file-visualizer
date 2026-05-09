import type { NormalizedEntry, RequestCategory } from "../types/har";
import type { StatusBucket as HttpStatusBucket } from "./http";
import { statusBucket } from "./http";

export type StatusBucket = HttpStatusBucket | "all";

export interface FilterState {
  search: string;
  pageref: string | "all";
  method: string | "all";
  category: RequestCategory | "all";
  status: StatusBucket;
  hideCached: boolean;
}

export const initialFilters: FilterState = {
  search: "",
  pageref: "all",
  method: "all",
  category: "all",
  status: "all",
  hideCached: false,
};

export function applyFilters(
  entries: NormalizedEntry[],
  f: FilterState,
): NormalizedEntry[] {
  const search = f.search.trim().toLowerCase();
  return entries.filter((e) => {
    if (f.pageref !== "all" && e.pageref !== f.pageref) return false;
    if (f.method !== "all" && e.method !== f.method) return false;
    if (f.category !== "all" && e.category !== f.category) return false;
    if (!matchesStatus(e.status, f.status)) return false;
    if (f.hideCached && e.fromCache) return false;
    if (search) {
      const haystack = `${e.url} ${e.method} ${e.status} ${e.mimeType}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

function matchesStatus(status: number, bucket: StatusBucket): boolean {
  if (bucket === "all") return true;
  return statusBucket(status) === bucket;
}

export type SortKey =
  | "startedAt"
  | "duration"
  | "status"
  | "method"
  | "host"
  | "path"
  | "transferSize"
  | "category";

export interface SortState {
  key: SortKey;
  dir: "asc" | "desc";
}

export const initialSort: SortState = { key: "startedAt", dir: "asc" };

export function applySort(
  entries: NormalizedEntry[],
  s: SortState,
): NormalizedEntry[] {
  const sign = s.dir === "asc" ? 1 : -1;
  const copy = entries.slice();
  copy.sort((a, b) => {
    const av = a[s.key];
    const bv = b[s.key];
    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * sign;
    }
    return String(av).localeCompare(String(bv)) * sign;
  });
  return copy;
}

export function uniqueMethods(entries: NormalizedEntry[]): string[] {
  return Array.from(new Set(entries.map((e) => e.method))).sort();
}

export function uniqueCategories(
  entries: NormalizedEntry[],
): RequestCategory[] {
  return Array.from(new Set(entries.map((e) => e.category))).sort();
}
