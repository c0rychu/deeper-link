/** What a platform (Chrome, Safari, a native app, a test) lends to a service while it resolves a link. */
export interface ResolveContext {
  /** fetch() that sends the user's cookies for the service's site. */
  fetch(url: string): Promise<Response>;
  /** Title of the page, set only when the URL being resolved is the page currently open. */
  pageTitle?: string;
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
