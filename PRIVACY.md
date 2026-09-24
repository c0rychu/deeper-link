# Privacy Policy — Deeper Link

_Effective: 2026-09-24_

Deeper Link turns Gmail links such as `https://mail.google.com/mail/u/1/#inbox/…` into links that name the account by email (`…/mail/u/?authuser=you@gmail.com#inbox/…`), so they keep opening the right mailbox regardless of sign-in order.

## What it reads, and why

To build a link, the extension needs the email address of the Gmail account in the URL. When you click the toolbar icon or a "Copy Deeper Link" menu item, it:

- reads the **URL and title of the Gmail tab** (or the URL of the Gmail link you right-clicked). Gmail titles contain the account's email address;
- if the title doesn't contain it, requests **`https://mail.google.com/mail/u/N/feed/atom`** (Gmail's own feed for that account, sent with your existing Google sign-in) and reads the email address from the feed's title. The rest of the feed is discarded immediately;
- writes the resulting link to your **clipboard**.

That's all. It only runs when you click the extension.

## What it does not do

- It does **not** send any data to the developer or to any third party. Its only network requests go to `mail.google.com`, i.e. to Google, which you are already signed in to.
- It does **not** store anything: no history, no cache, no settings, no cookies of its own.
- It does **not** include analytics, tracking, ads, or remote code.
- It does **not** read the contents of your emails.

## Permissions

| Permission | Used for |
|---|---|
| Access to `mail.google.com` | Reading Gmail tab URLs/titles and the account feed described above |
| Clipboard write | Copying the link you asked for |
| Offscreen document | Performing the clipboard write (Chrome requires a document for it) |
| Context menus | The right-click "Copy Deeper Link" items |

## Changes and contact

Changes to this policy will be committed to this file, with the date above updated. Questions: open an issue at <https://github.com/c0rychu/deeper-link/issues>.
