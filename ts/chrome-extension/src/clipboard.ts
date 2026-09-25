/**
 * Copies through a temporary <textarea>: needs a document, but neither focus nor a user gesture, which a background
 * or offscreen document never has (navigator.clipboard needs both). The manifest's "clipboardWrite" permission lifts
 * the gesture requirement; without it, execCommand returns false.
 */
export function copyWithTextarea(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}
