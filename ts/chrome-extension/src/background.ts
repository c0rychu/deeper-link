// Chrome glue: turns clicks into core.deepen() calls and puts the result on the clipboard.

import { deepen, type ResolveContext } from "@deeper-link/core";

const MENU_PAGE = "copy-page";
const MENU_LINK = "copy-link";
const GMAIL = ["https://mail.google.com/*"];
const BADGE_MS = 2000;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_PAGE,
    title: "Copy Deeper Link to This Page",
    contexts: ["page"],
    documentUrlPatterns: GMAIL,
  });
  chrome.contextMenus.create({
    id: MENU_LINK,
    title: "Copy Deeper Link",
    contexts: ["link"],
    targetUrlPatterns: GMAIL,
  });
});

chrome.action.onClicked.addListener((tab) => {
  copyDeeperLink(tab.url, tab.title, tab.id);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_PAGE) copyDeeperLink(info.pageUrl, tab?.title, tab?.id);
  if (info.menuItemId === MENU_LINK) copyDeeperLink(info.linkUrl, undefined, tab?.id);
});

/** `pageTitle` must only be given when `url` is the open page; it's how Gmail reveals the account's email. */
async function copyDeeperLink(url: string | undefined, pageTitle: string | undefined, tabId?: number) {
  try {
    if (!url) throw new Error("This tab has no URL");
    const ctx: ResolveContext = {
      fetch: (feedUrl) => fetch(feedUrl, { credentials: "include" }),
      pageTitle,
    };
    const link = await deepen(url, ctx);
    await copyToClipboard(link);
    await report(tabId, true, `Copied: ${link}`);
  } catch (error) {
    console.error("Deeper Link:", error);
    await report(tabId, false, `Deeper Link failed: ${error instanceof Error ? error.message : error}`);
  }
}

/** Badge flashes ✓/! briefly; the tooltip keeps the details until the next attempt. */
async function report(tabId: number | undefined, ok: boolean, message: string) {
  if (tabId === undefined) return;
  await chrome.action.setBadgeBackgroundColor({ tabId, color: ok ? "#188038" : "#d93025" });
  await chrome.action.setBadgeText({ tabId, text: ok ? "✓" : "!" });
  await chrome.action.setTitle({ tabId, title: message });
  setTimeout(() => chrome.action.setBadgeText({ tabId, text: "" }), BADGE_MS);
}

// Shared while a createDocument() is in flight: a second quick click would otherwise try to
// create a second offscreen document, which Chrome rejects.
let creatingOffscreen: Promise<void> | undefined;

/** MV3 service workers have no clipboard access, so an offscreen document does the copy. */
async function copyToClipboard(text: string) {
  if (!(await chrome.offscreen.hasDocument())) {
    creatingOffscreen ??= chrome.offscreen
      .createDocument({
        url: "offscreen.html",
        reasons: [chrome.offscreen.Reason.CLIPBOARD],
        justification: "Copy the stable link to the clipboard",
      })
      .finally(() => (creatingOffscreen = undefined));
    await creatingOffscreen;
  }
  const copied: boolean = await chrome.runtime.sendMessage({ target: "offscreen", type: "copy", text });
  if (!copied) throw new Error("Could not write to the clipboard");
}
