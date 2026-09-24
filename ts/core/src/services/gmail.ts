// Gmail: /mail/u/N/ (login-order index) → /mail/u/?authuser=<email>. See spec/gmail.md.

import { DeeperLinkError, type ResolveContext, type Service } from "../types";

const HOST = "mail.google.com";
const EMAIL = /^[^\s@<>()"',;]+@[^\s@<>()"',;]+\.[^\s@<>()"',;]+$/;
const ACCOUNT_PATH = /^\/mail(?:\/u\/(\d+))?(?=\/|$)/;

export const gmail: Service = {
  id: "gmail",

  matches: (url) => url.hostname === HOST && ACCOUNT_PATH.test(url.pathname),

  async deepen(url, ctx) {
    if (url.searchParams.has("authuser")) return url.href;
    const index = accountIndex(url);
    const email = emailFromTitle(ctx.pageTitle) ?? (await emailFromFeed(index, ctx));
    return stableUrl(url, email);
  },
};

export function accountIndex(url: URL): number {
  return Number(url.pathname.match(ACCOUNT_PATH)?.[1] ?? 0);
}

/** "Subject - me@gmail.com - Gmail" → "me@gmail.com". Only the second-to-last segment counts. */
export function emailFromTitle(title: string | undefined): string | undefined {
  const candidate = title?.split(" - ").at(-2)?.trim();
  return candidate && EMAIL.test(candidate) ? candidate : undefined;
}

/** The feed's first <title> reads "Gmail - Inbox for me@gmail.com". */
export function emailFromAtom(xml: string): string | undefined {
  const title = xml.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  return title.split(/\s+/).find((word) => EMAIL.test(word));
}

async function emailFromFeed(index: number, ctx: ResolveContext): Promise<string> {
  const feedUrl = `https://${HOST}/mail/u/${index}/feed/atom`;
  let response: Response;
  try {
    response = await ctx.fetch(feedUrl);
  } catch (error) {
    throw new DeeperLinkError(`Could not reach Gmail: ${error}`);
  }
  if (response.status === 401) {
    throw new DeeperLinkError(`No Gmail account is signed in at /u/${index}/`);
  }
  if (!response.ok) {
    throw new DeeperLinkError(`Gmail feed for /u/${index}/ returned HTTP ${response.status}`);
  }
  const email = emailFromAtom(await response.text());
  if (!email) throw new DeeperLinkError(`Could not find the email of Gmail account /u/${index}/`);
  return email;
}

function stableUrl(url: URL, email: string): string {
  const restOfPath = url.pathname.replace(ACCOUNT_PATH, "").replace(/^\/?/, "/");
  // Keep "@" readable; everything else (notably "+", which would decode as a space) is encoded.
  const query = [`authuser=${encodeURIComponent(email).replace("%40", "@")}`];
  if (url.search) query.push(url.search.slice(1));
  return `https://${HOST}/mail/u${restOfPath}?${query.join("&")}${url.hash}`;
}
