// Bundles the Chrome extension into dist/chrome-extension/, ready for "Load unpacked".

import { build } from "esbuild";
import { cp, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const root = here("../../");
const outdir = `${root}dist/chrome-extension`;

await rm(outdir, { recursive: true, force: true });

await build({
  entryPoints: [here("src/background.ts"), here("src/offscreen.ts")],
  outdir,
  bundle: true,
  format: "iife",
  target: "chrome116",
  tsconfig: `${root}tsconfig.json`, // resolves @deeper-link/core
  logLevel: "info",
});

await Promise.all([
  cp(here("manifest.json"), `${outdir}/manifest.json`),
  cp(here("src/offscreen.html"), `${outdir}/offscreen.html`),
  cp(here("icons"), `${outdir}/icons`, { recursive: true }),
]);
