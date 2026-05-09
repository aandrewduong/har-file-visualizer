// Single source of layout dimensions. Components reference these instead of
// embedding arbitrary pixel/vw values inline so the design stays consistent
// and tweaking a width touches one file.

export const LAYOUT = {
  searchInputMinWidthPx: 180,
  pageTitleMaxChars: 40,
  cookieValueTruncateChars: 80,
  base64PreviewBytes: 5 * 1024,
  copiedResetMs: 1500,
  topCategoryCount: 6,
  // Detail panel response body cap — `max-h-96` (24rem). Kept as a token so
  // the visual scale and the JS truncation can stay in sync.
  responseBodyMaxHeightClass: "max-h-96",

  // Splitter / pane sizing. Mins guarantee neither side collapses to nothing,
  // and the detail panel may grow up to a fraction of the workspace.
  resize: {
    listDefaultPx: 420,
    listMinPx: 240,
    waterfallMinPx: 240,
    detailDefaultPx: 480,
    detailMinPx: 320,
    detailMaxRatio: 0.6,
    // Visible bar width (1px) is intentionally hairline; the hit area extends
    // ±N pixels to either side so the grab target stays comfortable without
    // bloating the visual divider.
    splitterBarWidthPx: 1,
    splitterHitExtraPx: 4,
  },
} as const;

export const STORAGE_KEYS = {
  listWidth: "hfv:list-width",
  detailWidth: "hfv:detail-width",
} as const;

export const searchInputStyle = {
  minWidth: `${LAYOUT.searchInputMinWidthPx}px`,
};
