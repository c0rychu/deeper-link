/** What a platform (Chrome, Safari, a native app, a test) lends to a service while it resolves a link. */
export interface ResolveContext {
  /** fetch() that sends the user's cookies for the service's site. */
  fetch(url: string): Promise<Response>;
  /** Title of the page, set only when the URL being resolved is the page currently open. */
  pageTitle?: string;
  /**
   * `aria-label` of Google's account button on the open page, e.g. "Google Account: Alice\n(alice@example.com)".
   * Set only when the URL being resolved is the page currently open.
   */
  pageAccountLabel?: string;
  /** Account-button label from another open tab signed in as Google account number `index`, if there is one. */
  findAccountLabel?(index: number): Promise<string | undefined>;
}

/** A website whose fragile links we know how to make stable. */
export interface Service {
  id: string;
  matches(url: URL): boolean;
  /** Returns the stable link, or throws DeeperLinkError with a message fit for the user. */
  deepen(url: URL, ctx: ResolveContext): Promise<string>;
}

export class DeeperLinkError extends Error {
  override name = "DeeperLinkError";
}
