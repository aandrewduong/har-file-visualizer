// Manifest of bundled example HAR files served from `public/examples/`.
// Files are produced by `scripts/gen-examples.mjs`; keep this list in sync.

export interface Example {
  id: string;
  fileName: string;
  label: string;
  description: string;
}

export const EXAMPLES: readonly Example[] = [
  {
    id: "news-site",
    fileName: "news-site.har",
    label: "News site page load",
    description: "12 requests across HTML, CSS, JS, images, and XHR — typical content page.",
  },
  {
    id: "api-debug",
    fileName: "api-debug.har",
    label: "API debugging session",
    description: "7 fetch calls including a 401, a slow GET, a 500, and a 304.",
  },
];

// `BASE_URL` ends with "/" both locally ("/") and on GitHub Pages ("/repo/"),
// so the example HARs resolve correctly regardless of where the app is served.
export function exampleUrl(fileName: string): string {
  return `${import.meta.env.BASE_URL}examples/${fileName}`;
}
