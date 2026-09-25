# Privacy Policy — Deeper Link

_Effective: 2026-09-24 (updated for version 0.2.0: Google Drive and Docs support)_

Deeper Link turns Gmail, Google Drive and Google Docs links that name an account by its sign-in order (such as `https://mail.google.com/mail/u/1/#inbox/…` or `https://docs.google.com/document/u/1/d/…`) into links that name it by email (`?authuser=you@gmail.com`), so they keep opening the right account regardless of sign-in order.

## What it reads, and why

To build a link, the extension needs the email address of the Google account the link belongs to. When you click the toolbar icon or a "Copy Deeper Link" menu item, it:

- reads the **URL of the Gmail, Drive or Docs page** you are on (or of the link you right-clicked), and the **tab title** (Gmail titles contain the account's email address);
- reads the **label of Google's account button** on that page (top right, e.g. "Google Account: Alice (alice@example.com)"), which names the signed-in account. Nothing else on the page is read;
- if the page doesn't reveal the email, requests **`https://mail.google.com/mail/u/N/feed/atom`** (Gmail's own feed for that account, sent with your existing Google sign-in) and reads the email address from the feed's title; the rest of the feed is discarded immediately;
- if that fails too (e.g. a Workspace account without Gmail), reads the account button's label from **another open Gmail, Drive or Docs tab** signed in as the same account;
- writes the resulting link to your **clipboard**.

That's all. It only runs when you click the extension.

## What it does not do

- It does **not** send any data to the developer or to any third party. Its only network requests go to `mail.google.com`, i.e. to Google, which you are already signed in to.
- It does **not** store anything: no history, no cache, no settings, no cookies of its own.
- It does **not** include analytics, tracking, ads, or remote code.
- It does **not** read the contents of your emails or documents.

## Permissions

| Permission | Used for |
|---|---|
| Access to `mail.google.com`, `drive.google.com`, `docs.google.com` | Reading those tabs' URLs, titles and account-button labels, and Gmail's account feed, as described above |
| Scripting | Reading the account button's label on those Google pages |
| Clipboard write | Copying the link you asked for |
| Offscreen document | Performing the clipboard write (Chrome requires a document for it) |
| Context menus | The right-click "Copy Deeper Link" items |

## Changes and contact

Changes to this policy will be committed to this file, with the date above updated. Questions: open an issue at <https://github.com/c0rychu/deeper-link/issues>.
