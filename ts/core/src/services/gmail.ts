// Gmail: /mail/u/N/ (sign-in order) → /mail/u/?authuser=<email>. See spec/gmail.md.

import type { Service } from "../types";
import { accountEmail, accountNumber, hasEmailAuthuser, isEmail, stableQuery } from "./google-account";

const HOST = "mail.google.com";
const MAIL_PATH = /^\/mail(?:\/u\/\d+)?(?=\/|$)/;

export const gmail: Service = {
  id: "gmail",

  matches: (url) => url.hostname === HOST && MAIL_PATH.test(url.pathname),

  async deepen(url, ctx) {
    if (hasEmailAuthuser(url)) return url.href;
    const email = await accountEmail(accountNumber(url) ?? 0, ctx, emailFromTitle(ctx.pageTitle));
    const restOfPath = url.pathname.replace(MAIL_PATH, "").replace(/^\/?/, "/");
    return `https://${HOST}/mail/u${restOfPath}${stableQuery(url, email)}${url.hash}`;
  },
};

/** "Subject - me@gmail.com - Gmail" → "me@gmail.com". Only the second-to-last segment counts. */
export function emailFromTitle(title: string | undefined): string | undefined {
  const candidate = title?.split(" - ").at(-2)?.trim();
  return isEmail(candidate) ? candidate : undefined;
}
