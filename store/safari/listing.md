# Mac App Store submission (Safari)

Copy-paste answers for App Store Connect. Upload: `make safari-archive && make safari-upload` (bump `version` in
`package.json` per release, or `SAFARI_BUILD=n` to re-upload the same version). Apple rejects mentions of other
platforms, so nothing here names Chrome.

## Distribution → macOS App → version page

**Version:** the `package.json` version (a build attaches only to the version with the same number).

**Screenshots** (16:10; 1–10), in this order: `store/safari/images/screenshot-1.png` … `screenshot-4.png` (2880×1800).
Source: `store/safari/screenshots/screenshots.html`, rendered by `make images`. Safari only: Apple rejects screenshots
showing other platforms.

**Promotional Text** (170 chars, editable any time without review):
Copy Gmail, Drive and Docs links that always open the right account, whatever the sign-in order.

**Description** (App Store Connect rejects symbols like ✓ and →; • is fine):

```
Signed into more than one Google account? Then your Gmail, Drive and Docs links are fragile.

A link like mail.google.com/mail/u/1/... or docs.google.com/document/u/1/... means "the 2nd account you signed into". Sign in in a different order, or open the link on another computer, and it opens the wrong account, or nothing at all. Docs links without a number open in your default account, often not the one the file is shared with.

Deeper Link copies the same link with the account's email instead:
mail.google.com/mail/u/?authuser=you@gmail.com#inbox/...
docs.google.com/document/d/.../edit?authuser=you@company.com
It opens the right account, message or file no matter the sign-in order.

SET UP
Open Safari > Settings > Extensions, turn on Deeper Link, and allow it on mail.google.com, drive.google.com and docs.google.com.

HOW TO USE
• Click the Deeper Link toolbar button on any Gmail, Drive or Docs page: the stable link is copied (the button shows a check mark).
• Right-click one of those pages and choose "Copy Deeper Link to This Page".
• Right-click any Gmail, Drive or Docs link (in chats, notes, other docs) and choose "Copy Deeper Link".

HOW IT WORKS
The account's email is found on the fly, from the page's own Google account button, so there is nothing to configure and no lookup table to keep up to date. Works with Google Workspace accounts too, including ones without Gmail.

PRIVATE BY DESIGN
Everything happens in Safari on your Mac. No data is sent to the developer or anyone else, nothing is stored, no analytics. Open source: https://github.com/c0rychu/deeper-link
```

**Keywords** (100 chars, comma-separated, no spaces needed):
gmail,google drive,google docs,link,copy link,account,multiple accounts,authuser,workspace,url

**Support URL:** https://github.com/c0rychu/deeper-link/issues
**Marketing URL** (optional): https://github.com/c0rychu/deeper-link
**Copyright:** 2026 Yu-Kuang Chu

**App Review Information:**
- Sign-in required: unchecked (no account with us; reviewers use their own Google account).
- Contact: your name, phone and email (only Apple sees them).
- Notes:

```
No sign-in to our service is needed; any Google account works (two show the problem best).
1. Open the Deeper Link app once, then Safari > Settings > Extensions: enable Deeper Link and allow it on mail.google.com, drive.google.com and docs.google.com.
2. In Safari, sign into two Google accounts, open Gmail for the second one (URL contains /mail/u/1/), and open any message.
3. Click the Deeper Link toolbar button: it shows a check mark. Paste the clipboard: it is https://mail.google.com/mail/u/?authuser=<that account's email>#inbox/<message id>.
4. Open the pasted link: it shows the same message in the same account, even after signing out and back in in a different order.
5. Open any Google Doc or Drive folder in the second account and click the button: the copied link ends with ?authuser=<that account's email>.
6. Right-click a Gmail, Drive or Docs link on any page and choose "Copy Deeper Link": same stable form.
On an unsupported page the button shows "!" with the reason in its tooltip. The app window only explains how to enable the extension; everything else happens in Safari.
```

**Version Release:** Automatically release this version (or Manually, to pick the moment).

## General → App Information

- **Subtitle** (30 chars): Stable Google account links
- **Category:** Productivity (secondary: Utilities, optional)
- **Content Rights:** No, it does not contain, show, or access third-party content. (It only reads the user's own
  account email from Google pages the user has open.)
- **Age Rating:** answer None / No to everything (it isn't a web browser: "Unrestricted Web Access" is No) → 4+.

## App Privacy

- **Privacy Policy URL:** https://github.com/c0rychu/deeper-link/blob/main/PRIVACY.md
- **Data collection:** "No, we do not collect data from this app". Apple counts data as collected only when it leaves
  the device for the developer or a third party; the email stays on the Mac and in the copied link.

## Pricing and Availability

- **Price:** Free (USD 0).
- **Availability:** all countries or regions.
