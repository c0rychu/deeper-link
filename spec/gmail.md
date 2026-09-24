# Gmail

The language-neutral contract. Every implementation (TS, and later Python or Rust) must pass [`fixtures/gmail.json`](fixtures/gmail.json).

## Problem

`https://mail.google.com/mail/u/1/#inbox/FMfcg…` names an account by its **index** (`/u/1/`), meaning "the 2nd account you signed into". Sign in again in a different order and the same link opens a different mailbox.

Gmail also accepts the account's **email**, which doesn't change:

```
https://mail.google.com/mail/u/?authuser=me@gmail.com#inbox/FMfcg…
```

## Rules

A URL matches when the host is `mail.google.com` and the path starts with `/mail`.

1. The URL already has `authuser` → return it unchanged.
2. Account index `N` comes from `/mail/u/N/…`. With no `/u/N` segment, `N = 0`.
3. Resolve `N` to an email (first success wins):
   1. **Page title**, only when the URL is the page currently open. Gmail titles end in `… - <email> - <product>`, e.g. `Inbox (3) - me@gmail.com - Gmail`. Use the second-to-last ` - ` segment if it is exactly an email (subjects may also contain emails, so never search the whole title).
   2. **Atom feed**: `GET https://mail.google.com/mail/u/N/feed/atom` with the user's cookies. The feed's first `<title>` is `Gmail - Inbox for <email>`.
      HTTP 401 means no account is signed in at index `N`.
4. Build the result: drop `/u/N`, add `authuser=<email>` as the first query parameter, keep the remaining path, other query parameters, and the `#fragment`.
   `/mail/u/0/?pli=1#inbox/X` → `/mail/u/?authuser=me@gmail.com&pli=1#inbox/X`.
   The email is percent-encoded except `@` (kept for readability), so `a+b@example.com` → `a%2Bb@example.com` (a raw `+` would mean a space).

Don't cache index → email: login order can change at any time.
