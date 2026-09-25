# Google Drive and Docs editors

Covers `drive.google.com` (folders, files) and `docs.google.com` (Docs, Sheets, Slides, Forms, Drawings). Every implementation must pass [`fixtures/google-drive.json`](fixtures/google-drive.json). Account resolution is shared: see [google-account.md](google-account.md).

## Problem

Drive links carry the sign-in number (`drive.google.com/drive/u/1/folders/…`, `docs.google.com/document/u/1/d/…`, or `?authuser=1`), or no account at all (`docs.google.com/document/d/…/edit`), in which case they open in the **default** (first) account, often the wrong one.

## Rules

A URL matches when the host is `drive.google.com` or `docs.google.com`.

1. `authuser` is anything but a number → return the URL unchanged.
2. Find the account per [google-account.md](google-account.md): `authuser=N`, else a `/u/N/` path segment, else the default account `0`. The open page's account button, when available, wins over all of these.
   **Exception:** an open Drive/Docs page whose URL names no account often runs as a non-default account (the URL doesn't say). If its account button can't be read, report an error: never assume `0`.
3. Build the result: remove the `/u/N` path segment wherever it appears, then add `authuser=<email>` first in the query.
   - `drive.google.com/drive/u/1/folders/F` → `drive.google.com/drive/folders/F?authuser=me@example.com`
   - `docs.google.com/document/u/1/d/D/edit?tab=t.0#heading=h.1` → `docs.google.com/document/d/D/edit?authuser=me@example.com&tab=t.0#heading=h.1`
   - `docs.google.com/spreadsheets/d/S/edit?authuser=2#gid=0` → `docs.google.com/spreadsheets/d/S/edit?authuser=me@example.com#gid=0`
