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
Account resolution is shared with other Google services: see [google-account.md](google-account.md).

1. `authuser` is already an email → return the URL unchanged.
2. Find the account: `authuser=N`, else `/mail/u/N/…`, else `N = 0`.
3. Resolve it to an email per [google-account.md](google-account.md). Gmail's page clue (step 2 there) is the **tab title**, which ends in `… - <email> - <product>`, e.g. `Inbox (3) - me@gmail.com - Gmail`. Use the second-to-last ` - ` segment if it is exactly an email (subjects may also contain emails, so never search the whole title).
4. Build the result: drop `/u/N`, add `authuser=<email>` as the first query parameter, keep the remaining path, other query parameters, and the `#fragment`.
   `/mail/u/0/?pli=1#inbox/X` → `/mail/u/?authuser=me@gmail.com&pli=1#inbox/X`.
