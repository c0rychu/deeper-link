// Chrome glue: turns clicks into core.deepen() calls and puts the result on the clipboard.

import { accountNumber, deepen, type ResolveContext } from "@deeper-link/core";

const MENU_PAGE = "copy-page";
const MENU_LINK = "copy-link";
// Pages we hold host permissions for (manifest.json): the only ones whose URLs and account buttons we can read.
const GOOGLE = ["https://mail.google.com/*", "https://drive.google.com/*", "https://docs.google.com/*"];
const BADGE_MS = 2000;

chrome.runtime.onInstalled.addListener(() => {
  // Recreate on every install/update so menu patterns follow the manifest.
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_PAGE,
      title: "Copy Deeper Link to This Page",
      contexts: ["page"],
      documentUrlPatterns: GOOGLE,
    });
    chrome.contextMenus.create({
      id: MENU_LINK,
      title: "Copy Deeper Link",
      contexts: ["link"],
      targetUrlPatterns: GOOGLE,
    });
  });
});

chrome.action.onClicked.addListener((tab) => {
  copyDeeperLink(tab.url, tab, true);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_PAGE) copyDeeperLink(info.pageUrl, tab, true);
  if (info.menuItemId === MENU_LINK) copyDeeperLink(info.linkUrl, tab, false);
});

/** `isOpenPage`: `url` is the page open in `tab`, so the page itself can say which account it uses. */
async function copyDeeperLink(url: string | undefined, tab: chrome.tabs.Tab | undefined, isOpenPage: boolean) {
  const tabId = tab?.id;
  try {
    // Without a host permission for the page, Chrome hides its URL: it is not a page we support.
    if (!url) throw new Error("Deeper Link works on Gmail, Drive and Docs pages only");
    const page = isOpenPage && tabId !== undefined;
    const ctx: ResolveContext = {
      fetch: (feedUrl) => fetch(feedUrl, { credentials: "include" }),
      isOpenPage: page,
      pageTitle: page ? tab?.title : undefined,
      pageAccountLabel: page ? await readAccountLabel(tabId) : undefined,
      findAccountLabel,
    };
    const link = await deepen(url, ctx);
    await copyToClipboard(link);
    await report(tabId, true, `Copied: ${link}`);
  } catch (error) {
    console.error("Deeper Link:", error);
    await report(tabId, false, `Deeper Link failed: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * The `aria-label` of Google's account button (top right of every Google app), which ends with the signed-in
 * email: "Google Account: Alice\n(alice@example.com)". Undefined if the tab isn't a page we may read.
 */
async function readAccountLabel(tabId: number): Promise<string | undefined> {
  try {
    const [frame] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () =>
        document.querySelector('a[href*="accounts.google.com/SignOutOptions"][aria-label]')?.getAttribute("aria-label") ?? null,
    });
    return frame?.result ?? undefined;
  } catch {
    return undefined;
  }
}

/** Account-button label from any open Gmail/Drive/Docs tab whose URL means account `index` (same rules as links). */
async function findAccountLabel(index: number): Promise<string | undefined> {
  for (const tab of await chrome.tabs.query({ url: GOOGLE })) {
    if (tab.id === undefined || !tab.url || accountNumber(new URL(tab.url)) !== index) continue;
    const label = await readAccountLabel(tab.id);
    if (label) return label;
  }
  return undefined;
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
