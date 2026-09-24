// Offscreen document: the only place an MV3 extension can write to the clipboard without a visible page.
// navigator.clipboard needs a focused document, which an offscreen one never is, hence execCommand.
// execCommand("copy") also needs a user gesture, which this document never gets; the manifest's
// "clipboardWrite" permission lifts that requirement. Without it, execCommand returns false.

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.target !== "offscreen" || message.type !== "copy") return;
  const textarea = document.createElement("textarea");
  textarea.value = message.text;
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  sendResponse(copied);
});
