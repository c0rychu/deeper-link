# Chrome Web Store submission

Copy-paste answers for each tab of the developer dashboard. Upload: `make package` → `dist/deeper-link-chrome-<version>.zip`.

## Package tab

- File: `dist/deeper-link-chrome-<version>.zip` (bump `version` in `package.json` before every re-upload).

## Store listing tab

**Name** (from the manifest): Deeper Link

**Summary** (from the manifest `description`, max 132 chars):
Copy stable links that don't depend on account login order (Gmail /u/0/ → ?authuser=you@gmail.com).

**Description:**

```
Signed into more than one Google account? Then your Gmail links are fragile.

A link like mail.google.com/mail/u/1/#inbox/… means "the 2nd account you signed into". Sign in in a different order, or share the link with your other computer, and it opens the wrong mailbox, or nothing at all.

Deeper Link copies the same link with the account's email instead:
mail.google.com/mail/u/?authuser=you@gmail.com#inbox/…
It opens the right mailbox and message no matter the sign-in order.

HOW TO USE
• Click the toolbar icon on any Gmail page: the stable link is copied (the icon shows ✓).
• Right-click a Gmail page → "Copy Deeper Link to This Page".
• Right-click any Gmail link (in docs, notes, chats) → "Copy Deeper Link".

HOW IT WORKS
The account's email is found on the fly, from the Gmail tab title or Gmail's own account feed, so there is nothing to configure and no lookup table to keep up to date.

PRIVATE BY DESIGN
Everything happens in your browser. No data is sent to the developer or anyone else, nothing is stored, no analytics. Open source: https://github.com/c0rychu/deeper-link
```

**Category:** Productivity (Tools, or Workflow & Planning)
**Language:** English

**Graphic assets:**

| Field | File |
|---|---|
| Store icon (128×128) | `ts/chrome-extension/icons/128.png` |
| Small promo tile (440×280) | `store/chrome/images/promo-small-440x280.png` |
| Screenshots (1280×800, 1–5) | `store/chrome/images/screenshot-1-context-menu-1280x800.png` (source: `store/chrome/screenshots/`) |
| Marquee (1400×560) | optional, skipped |

Screenshot ideas (blur real email addresses and subjects):
1. A Gmail message open, toolbar icon showing ✓, tooltip "Copied: https://mail.google.com/mail/u/?authuser=…".
2. The right-click menu on a Gmail link showing "Copy Deeper Link".

To get exactly 1280×800: resize the window, or take the screenshot and run `sips -z 800 1280 in.png --out out.png` (only when the aspect ratio is already 16:10).

**Official URL / Homepage:** https://github.com/c0rychu/deeper-link
**Support URL:** https://github.com/c0rychu/deeper-link/issues

## Privacy tab

**Single purpose:**

```
Copy Gmail links that identify the account by email address (?authuser=you@gmail.com) instead of by sign-in order (/u/0/), so the links keep opening the right mailbox.
```

**Permission justifications:**

- **Host permission `https://mail.google.com/*`:**
  ```
  To build the stable link the extension needs the email of the Gmail account in the URL. It reads the Gmail tab's URL and title (which contains the email), and, when the title doesn't, requests Gmail's own account feed (mail.google.com/mail/u/N/feed/atom) with the user's existing sign-in and reads only the email address from its title. No other site is accessed.
  ```
- **clipboardWrite:**
  ```
  The extension's only output is the stable link, copied to the clipboard when the user clicks the toolbar icon or context-menu item. The copy happens in an offscreen document, which never receives the user's click, so the clipboardWrite permission is required for document.execCommand('copy') to succeed.
  ```
- **offscreen:**
  ```
  Manifest V3 service workers cannot access the clipboard. An offscreen document (reason: CLIPBOARD) is created solely to write the link to the clipboard.
  ```
- **contextMenus:**
  ```
  Adds "Copy Deeper Link to This Page" on Gmail pages and "Copy Deeper Link" on links pointing to Gmail, so users can convert a link without opening it.
  ```

**Remote code:** No, I am not using remote code. (All JavaScript is bundled in the package.)

**Data usage — what the extension handles:**

- [x] **Personally identifiable information:** the Gmail account's email address, read from the tab title or account feed and placed into the copied link.
- [x] **Website content:** the Gmail tab's URL and title, and the URL of a right-clicked Gmail link.
- [x] **Personal communications** (conservative): the Gmail account feed that is requested also lists unread message subjects; the extension reads only the email address from the feed's title and discards the rest immediately.
- [ ] Everything else (health, financial, authentication info, location, web history, user activity).

All of the above is processed locally, on demand, and never stored or transmitted anywhere except the request to mail.google.com itself.

**Certifications** (check all three):
- [x] I do not sell or transfer user data to third parties, outside of the approved use cases.
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/c0rychu/deeper-link/blob/main/PRIVACY.md

## Test instructions tab

```
No credentials needed; use any Google account(s).
1. Sign into two Google accounts in Chrome, open Gmail for the second one (URL contains /mail/u/1/), and open any message.
2. Click the Deeper Link toolbar icon. The icon shows a green ✓; paste the clipboard: it is https://mail.google.com/mail/u/?authuser=<that account's email>#inbox/<message id>.
3. Open the pasted link: it shows the same message in the same account, even after signing out and back in in a different order.
4. Right-click a Gmail link on any page → "Copy Deeper Link" gives the same stable form.
On a non-Gmail page the icon shows a red "!" with the reason in its tooltip.
```

## Distribution tab

- Pricing: Free.
- Visibility: Public (or Unlisted to share by link only).
- Regions: All.
