<img src="assets/mark.svg" height="80" alt="Deeper Link logo">

# Deeper Link

Copy links that stay stable no matter which order you signed into your accounts.

Gmail, Drive and Docs links like `https://mail.google.com/mail/u/1/#inbox/FMfcg…` or `https://docs.google.com/document/u/1/d/…` point to "the 2nd account you signed into". Sign in in a different order and the link opens the wrong account. Deeper Link rewrites them to name the account by email:

```
https://mail.google.com/mail/u/?authuser=you@gmail.com#inbox/FMfcg…
https://docs.google.com/document/d/…/edit?authuser=you@company.com
```

It finds the email on the fly (from the page's Google account button or the Gmail tab title, else Gmail's account feed or another open tab of that account), so there's no lookup table to maintain, and Workspace accounts without Gmail work too. Details: [spec/google-account.md](spec/google-account.md), [spec/gmail.md](spec/gmail.md), [spec/google-drive.md](spec/google-drive.md).

## Use (Chrome)

- **Toolbar icon** on a Gmail, Drive or Docs tab → the stable link to that page is copied. The badge shows ✓ or !; hover the icon for details.
- **Right-click** on one of those pages → *Copy Deeper Link to This Page*.
- **Right-click a Gmail, Drive or Docs link** anywhere → *Copy Deeper Link*.

## Develop

Requires Node and pnpm. The repo lives in Dropbox, so `node_modules` (and later `.venv`, optionally `dist`) are **symlinks to directories outside Dropbox**. Create them before installing; `make install` refuses to run without `node_modules`.
This needs pnpm ≥ 12 (10.x deletes the link's target) and `hoist: false` in `pnpm-workspace.yaml` (pnpm won't hoist into a symlink).

```sh
ln -s ~/somewhere/outside/dropbox/node_modules node_modules
make install
make check          # typecheck + tests
make build          # → dist/chrome-extension/ and dist/safari-extension/
make package        # → dist/deeper-link-chrome-<version>.zip for the Web Store (version from package.json)
make safari-app     # → an unsigned macOS app with the Safari extension, opened for local testing (needs Xcode)
make safari-archive # → a signed Mac App Store archive (version from package.json; SAFARI_BUILD=n to re-upload one)
make safari-upload  # → uploads that archive to App Store Connect, for TestFlight and review
```

Then in Chrome: `chrome://extensions` → Developer mode → *Load unpacked* → `dist/chrome-extension`.
In Safari: Settings → Advanced → *Show features for web developers*, then Settings → Developer → *Allow unsigned extensions*, run `make safari-app`, and enable Deeper Link in Settings → Extensions.

`make help` lists all targets.

## Layout

One repo for every language: project manifests at the root, sources in per-language dirs.

```
Makefile, package.json, tsconfig.json   # (later: pyproject.toml, Cargo.toml)
spec/                  language-neutral rules + shared test fixtures
assets/                logo sources for every platform: icon.svg + pixel-grid icon-16.svg (`make images` renders the PNGs and mark.svg)
ts/core/               platform-free TypeScript: Service interface, registry, services/
ts/chrome-extension/   browser glue for Chrome and Safari (toolbar, context menu, clipboard); build.mjs derives the Safari manifest,
                       safari-project.sh generates the Safari app's Xcode project
store/chrome/          Chrome Web Store listing text (listing.md), images, and screenshot sources
store/safari/          Mac App Store listing text (listing.md), app icon and screenshots
PRIVACY.md             privacy policy (linked from the store)
```

### Adding things

- **A service** (e.g. Google Calendar): write `spec/<service>.md` + `spec/fixtures/<service>.json`, implement `Service` in `ts/core/src/services/<service>.ts`, add it to `services` in `ts/core/src/registry.ts` and its fixtures to `ts/core/test/fixtures.test.ts`. Google services should resolve accounts through `services/google-account.ts`.
- **A platform** (e.g. a native app): a new `ts/<platform>/` that calls `deepen()` from `@deeper-link/core` and supplies a `ResolveContext` (a credentialed `fetch`, plus the page title when available). Add a `build-<platform>` Make target.
- **A language** (e.g. Python, Rust): a `python/` or `rust/` source dir, its manifest at the root, Make targets hooked into `build`/`test`, and tests that run `spec/fixtures/*.json`.
