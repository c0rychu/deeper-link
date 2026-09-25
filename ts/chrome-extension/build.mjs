// Bundles the extension into dist/chrome-extension/ (ready for "Load unpacked") and dist/safari-extension/ (input for
// Apple's Safari web extension packager). Both share one background.js; only the manifest and offscreen files differ.

import { build } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const root = here("../../");
const chromeDir = `${root}dist/chrome-extension`;
const safariDir = `${root}dist/safari-extension`;

await Promise.all([chromeDir, safariDir].map((dir) => rm(dir, { recursive: true, force: true })));

await build({
  entryPoints: [here("src/background.ts"), here("src/offscreen.ts")],
  outdir: chromeDir,
  bundle: true,
  format: "iife",
  target: ["chrome116", "safari17"],
  tsconfig: `${root}tsconfig.json`, // resolves @deeper-link/core
  logLevel: "info",
});

// package.json is the single source of the version; both stores require it to increase on every upload.
const { version } = JSON.parse(await readFile(`${root}package.json`, "utf8"));
const manifest = { ...JSON.parse(await readFile(here("manifest.json"), "utf8")), version };

/**
 * Safari has no offscreen API, so background.ts copies from its own DOM, which only a background page has (a service
 * worker has none). In Manifest V3 that page still unloads when idle. Safari 17 is the first to return
 * executeScript results (the account button's label).
 */
function safariManifest({ minimum_chrome_version, ...chrome }) {
  // App Store upload rejects longer ones (Chrome allows 132), so fail here rather than at the end of an upload.
  if (chrome.description.length > 112) throw new Error(`manifest description is over Safari's 112 characters`);
  return {
    ...chrome,
    permissions: chrome.permissions.filter((permission) => permission !== "offscreen"),
    background: { scripts: ["background.js"] },
    browser_specific_settings: { safari: { strict_min_version: "17.0" } },
  };
}

const json = (value) => JSON.stringify(value, null, 2) + "\n";
await mkdir(safariDir, { recursive: true });
await Promise.all([
  writeFile(`${chromeDir}/manifest.json`, json(manifest)),
  cp(here("src/offscreen.html"), `${chromeDir}/offscreen.html`),
  cp(here("icons"), `${chromeDir}/icons`, { recursive: true }),
  writeFile(`${safariDir}/manifest.json`, json(safariManifest(manifest))),
  cp(`${chromeDir}/background.js`, `${safariDir}/background.js`),
  cp(here("icons"), `${safariDir}/icons`, { recursive: true }),
]);
