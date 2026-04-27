import { defineConfig } from "vite";

// Relative base so one build works for:
// - Custom domain (e.g. www.happygirl.co.uk) — site is at host root, not /TheHungryViper/
// - GitHub project URL — kcnward.github.io/TheHungryViper/ (paths resolve relative to that folder)
export default defineConfig({
  base: "./",
  // Copy-only assets (CNAME, .nojekyll) live in public/; never add those only under docs/ —
  // emptyOutDir clears docs/ before each build, then Vite copies public/ → outDir.
  publicDir: "public",
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});
