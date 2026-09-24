# Deeper Link

Copy links that stay stable no matter which order you signed into your accounts.

Gmail links like `https://mail.google.com/mail/u/1/#inbox/FMfcg…` point to "the 2nd account you signed into". Sign in in a different order and the link opens the wrong mailbox. Deeper Link rewrites them to

```
https://mail.google.com/mail/u/?authuser=you@gmail.com#inbox/FMfcg…
```

It finds the email on the fly (from the Gmail tab title, or the account's Atom feed), so there's no lookup table to maintain. Details: [spec/gmail.md](spec/gmail.md).

## Use (Chrome)

- **Toolbar icon** on a Gmail tab → the stable link to that page is copied. The badge shows ✓ or !; hover the icon for details.
- **Right-click** in Gmail → *Copy Deeper Link to This Page*.
- **Right-click a Gmail link** anywhere → *Copy Deeper Link*.

## Develop

Requires Node and pnpm. The repo lives in Dropbox, so `node_modules` (and later `.venv`, optionally `dist`) are **symlinks to directories outside Dropbox**. Create them before installing; `make install` refuses to run without `node_modules`.
This needs pnpm ≥ 12 (10.x deletes the link's target) and `hoist: false` in `pnpm-workspace.yaml` (pnpm won't hoist into a symlink).

```sh
ln -s ~/somewhere/outside/dropbox/node_modules node_modules
make install
make check          # typecheck + tests
make build          # → dist/chrome-extension/
```

Then in Chrome: `chrome://extensions` → Developer mode → *Load unpacked* → `dist/chrome-extension`.

`make help` lists all targets.

## Layout

One repo for every language: project manifests at the root, sources in per-language dirs.

```
Makefile, package.json, tsconfig.json   # (later: pyproject.toml, Cargo.toml)
spec/                  language-neutral rules + shared test fixtures
assets/icon.svg        the logo, source for every platform's icons (`make icons` renders Chrome's PNGs)
ts/core/               platform-free TypeScript: Service interface, registry, services/
ts/chrome-extension/   Chrome MV3 glue only (toolbar, context menu, clipboard)
```

### Adding things

- **A service** (e.g. Google Drive): write `spec/<service>.md` + `spec/fixtures/<service>.json`, implement `Service` in `ts/core/src/services/<service>.ts`, add it to `services` in `ts/core/src/registry.ts`.
- **A platform** (e.g. Safari): a new `ts/<platform>/` that calls `deepen()` from `@deeper-link/core` and supplies a `ResolveContext` (a credentialed `fetch`, plus the page title when available). Add a `build-<platform>` Make target.
- **A language** (e.g. Python, Rust): a `python/` or `rust/` source dir, its manifest at the root, Make targets hooked into `build`/`test`, and tests that run `spec/fixtures/*.json`.
