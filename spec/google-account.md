# Google accounts (shared by all Google services)

Every Google web app (Gmail, Drive, Docs, …) shares one sign-in session. Signing into several accounts numbers them by **sign-in order**: `/u/0/` is the first, `/u/1/` the second, and so on. The same number means the same account in every app. Links carry that number either in the path (`/u/1/`) or as `?authuser=1`, and it breaks whenever the sign-in order changes.

Google also accepts the account's **email** as `?authuser=<email>`, which never changes. Verified by hand for Gmail, Docs and Drive; not officially documented by Google, but used by Google's own tools (e.g. Site Kit's deep links).

## Which account does a URL mean?

- `?authuser=<email>`: that account; the link is already stable.
- `?authuser=N` (a number), or a `/u/N/` path segment: account number `N`.
- Neither: the app's default account, number `0`, unless the page itself says otherwise (see step 1).

## Finding the email (first success wins)

1. **The open page's account button** (only when the URL is the page currently open). Every Google app shows the signed-in account in the top-right corner. That button links to `accounts.google.com/SignOutOptions`, and its `aria-label` ends with the email in parentheses:
   `Google Account: Alice Example  \n(alice@example.com)`. The prefix is localized, so take the email from the **final parentheses** only.
   This is the most reliable source: it names the account that actually opened the page, even when the URL has no number, and it works for Workspace accounts with Gmail disabled.
2. **Service-specific page clues**, e.g. Gmail's tab title (see [gmail.md](gmail.md)).
3. **Gmail's account feed** `GET https://mail.google.com/mail/u/N/feed/atom` (with the user's cookies). The feed's first `<title>` is `Gmail - Inbox for <email>`. HTTP 401 means nobody is signed in at `N`. Doesn't work for accounts without Gmail.
4. **Another open tab signed in as `N`**: any open Gmail, Drive or Docs tab whose URL has `/u/N/` or `authuser=N`; read its account button as in step 1. This covers accounts without Gmail when the link isn't the open page.

If all fail, report why and suggest opening any Gmail, Drive or Docs page for that account.

## Building the stable link

Add `authuser=<email>` as the **first** query parameter; keep other parameters and the `#fragment`; drop any numeric `authuser`. How `/u/N` is dropped from the path is service-specific.
The email is percent-encoded except `@` (kept for readability), so `a+b@example.com` → `a%2Bb@example.com` (a raw `+` would mean a space).

Don't cache number → email: sign-in order can change at any time.
