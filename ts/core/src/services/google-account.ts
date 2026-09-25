// Which Google account a URL means, and that account's email. Shared by every Google service.
// See spec/google-account.md.

import { DeeperLinkError, type ResolveContext } from "../types";

const EMAIL = /^[^\s@<>()"',;]+@[^\s@<>()"',;]+\.[^\s@<>()"',;]+$/;

export function isEmail(text: string | undefined | null): text is string {
  return !!text && EMAIL.test(text);
}

/** The URL already names its account by email (`?authuser=me@example.com`), so it is stable. */
export function hasEmailAuthuser(url: URL): boolean {
  return isEmail(url.searchParams.get("authuser"));
}

/** Account number from `?authuser=N` or a `/u/N/` path segment; undefined when the URL names none. */
export function accountNumber(url: URL): number | undefined {
  const authuser = url.searchParams.get("authuser");
  if (authuser !== null && /^\d+$/.test(authuser)) return Number(authuser);
  const segment = url.pathname.match(/\/u\/(\d+)(?=\/|$)/)?.[1];
  return segment === undefined ? undefined : Number(segment);
}

/** "Google Account: Alice\n(alice@example.com)" → "alice@example.com". The prefix is localized; only the final parentheses count. */
export function emailFromAccountLabel(label: string | undefined): string | undefined {
  const email = label?.match(/\(([^()]*)\)\s*$/)?.[1]?.trim();
  return isEmail(email) ? email : undefined;
}

/** The Gmail feed's first <title> reads "Gmail - Inbox for me@gmail.com". */
export function emailFromAtom(xml: string): string | undefined {
  const title = xml.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  return title.split(/\s+/).find(isEmail);
}

/**
 * Email of Google account number `index` (spec/google-account.md, first success wins):
 * the open page's account button, then `pageEmail` (a service's own page clue), then Gmail's feed,
 * then another open tab signed in as that account.
 */
export async function accountEmail(index: number, ctx: ResolveContext, pageEmail?: string): Promise<string> {
  const fromPage = emailFromAccountLabel(ctx.pageAccountLabel) ?? pageEmail;
  if (fromPage) return fromPage;
  try {
    return await emailFromFeed(index, ctx);
  } catch (error) {
    const fromTab = emailFromAccountLabel(await ctx.findAccountLabel?.(index));
    if (fromTab) return fromTab;
    const reason = error instanceof Error ? error.message : String(error);
    throw new DeeperLinkError(`${reason}; open any Gmail, Drive or Docs page for that account and try again`);
  }
}

async function emailFromFeed(index: number, ctx: ResolveContext): Promise<string> {
  let response: Response;
  try {
    response = await ctx.fetch(`https://mail.google.com/mail/u/${index}/feed/atom`);
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

/**
 * The URL's query with `authuser=<email>` first and any old `authuser` dropped. Other parameters keep their
 * original encoding. "@" stays readable; everything else is encoded (notably "+", which would decode as a space).
 */
export function stableQuery(url: URL, email: string): string {
  const rest = url.search.slice(1).split("&").filter((part) => part && !/^authuser(=|$)/.test(part));
  return "?" + [`authuser=${encodeURIComponent(email).replace("%40", "@")}`, ...rest].join("&");
}
