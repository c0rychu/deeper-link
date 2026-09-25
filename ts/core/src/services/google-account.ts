// Which Google account a URL means, and that account's email. Shared by every Google service.
// See spec/google-account.md.

import { DeeperLinkError, type ResolveContext } from "../types";

const EMAIL = /^[^\s@<>()"',;]+@[^\s@<>()"',;]+\.[^\s@<>()"',;]+$/;

export function isEmail(text: string | undefined | null): text is string {
  return !!text && EMAIL.test(text);
}

/** A `/u/N/` path segment. */
export const ACCOUNT_SEGMENT = /\/u\/(\d+)(?=\/|$)/;

/**
 * Which Google account number a URL means: `?authuser=N`, else a `/u/N/` path segment, else the default, 0.
 * Undefined when `authuser` is anything but a number (normally an email): the URL is already stable, leave it alone.
 */
export function accountNumber(url: URL): number | undefined {
  const authuser = url.searchParams.get("authuser");
  if (authuser) return /^\d+$/.test(authuser) ? Number(authuser) : undefined;
  return Number(url.pathname.match(ACCOUNT_SEGMENT)?.[1] ?? 0);
}

/** The URL says which account it means (`authuser` or `/u/N/`); otherwise it only implies the default. */
export function namesAccount(url: URL): boolean {
  return url.searchParams.has("authuser") || ACCOUNT_SEGMENT.test(url.pathname);
}

/**
 * "Google Account: Alice\n(alice@example.com), Google membership" → "alice@example.com".
 * Text before and after is localized and optional, so take the last parenthesized email.
 */
export function emailFromAccountLabel(label: string | undefined): string | undefined {
  const emails = [...(label ?? "").matchAll(/\(([^()]*)\)/g)].map((m) => m[1].trim()).filter(isEmail);
  return emails.at(-1);
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
    const fromTab = emailFromAccountLabel(await labelFromOpenTab(index, ctx));
    if (fromTab) return fromTab;
    const reason = error instanceof Error ? error.message : String(error);
    throw new DeeperLinkError(
      `Couldn't identify Google account /u/${index}/ (${reason}). Open any Gmail, Drive or Docs page for that account and try again.`,
    );
  }
}

/** A failing lookup must not hide the real reason (the feed's error), so it counts as "no tab". */
async function labelFromOpenTab(index: number, ctx: ResolveContext): Promise<string | undefined> {
  try {
    return await ctx.findAccountLabel?.(index);
  } catch {
    return undefined;
  }
}

async function emailFromFeed(index: number, ctx: ResolveContext): Promise<string> {
  let response: Response;
  try {
    response = await ctx.fetch(`https://mail.google.com/mail/u/${index}/feed/atom`);
  } catch (error) {
    throw new Error(`couldn't reach Gmail's feed: ${error}`);
  }
  // Reasons are shown inside accountEmail's message, so they are lowercase fragments.
  if (response.status === 401) throw new Error("no Gmail account is signed in there");
  if (!response.ok) throw new Error(`Gmail's feed returned HTTP ${response.status}`);
  const email = emailFromAtom(await response.text());
  if (!email) throw new Error("Gmail's feed has no email; Gmail may be off for this account");
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
