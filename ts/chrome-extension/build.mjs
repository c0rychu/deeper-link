// Bundles the Chrome extension into dist/chrome-extension/, ready for "Load unpacked".

import { build } from "esbuild";
import { cp, readFile, rm, writeFile } from "node:fs/promises";
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

// package.json is the single source of the version; the store requires it to increase on every upload.
const { version } = JSON.parse(await readFile(`${root}package.json`, "utf8"));
const manifest = JSON.parse(await readFile(here("manifest.json"), "utf8"));

await Promise.all([
  writeFile(`${outdir}/manifest.json`, JSON.stringify({ ...manifest, version }, null, 2) + "\n"),
  cp(here("src/offscreen.html"), `${outdir}/offscreen.html`),
  cp(here("icons"), `${outdir}/icons`, { recursive: true }),
]);
