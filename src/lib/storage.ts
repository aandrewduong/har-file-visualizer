// Tiny localStorage wrappers. localStorage may throw under private browsing
// or storage quota — callers should always get a value back, never an error.

export function readNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

export function writeNumber(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // No-op on storage failure; resize state is non-critical.
  }
}
