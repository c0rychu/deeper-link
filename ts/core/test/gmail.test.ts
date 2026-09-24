import { describe, expect, it } from "vitest";
import { deepen, type ResolveContext } from "@deeper-link/core";
import fixture from "../../../spec/fixtures/gmail.json";

interface Feed {
  status: number;
  body: string;
}

interface Case {
  name: string;
  url: string;
  pageTitle?: string;
  feeds?: Record<string, Feed>;
  expected?: string;
  error?: string;
}

/** Serves the case's atom feeds; any other request is a 404 so unexpected fetches fail loudly. */
function fakeFetch(feeds: Record<string, Feed> = {}): ResolveContext["fetch"] {
  return async (url) => {
    const index = url.match(/\/mail\/u\/(\d+)\/feed\/atom$/)?.[1];
    const feed = index === undefined ? undefined : feeds[index];
    return feed
      ? new Response(feed.body, { status: feed.status })
      : new Response("not found", { status: 404 });
  };
}

describe("gmail (spec/fixtures/gmail.json)", () => {
  for (const c of fixture.cases as Case[]) {
    it(c.name, async () => {
      const result = deepen(c.url, { fetch: fakeFetch(c.feeds), pageTitle: c.pageTitle });
      if (c.error) await expect(result).rejects.toThrow(c.error);
      else await expect(result).resolves.toBe(c.expected);
    });
  }
});
