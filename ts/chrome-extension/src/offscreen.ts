// Offscreen document (Chrome only): the only place a Chrome MV3 extension can write to the clipboard without a
// visible page.

import { copyWithTextarea } from "./clipboard";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.target !== "offscreen" || message.type !== "copy") return;
  sendResponse(copyWithTextarea(message.text));
});
