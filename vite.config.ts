import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// `base` defaults to "/" for local dev/preview but is overridden during the
// GitHub Pages build via `VITE_BASE` so assets resolve under
// `https://<user>.github.io/<repo>/`.
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
});
