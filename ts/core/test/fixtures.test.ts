// Runs the language-neutral cases in spec/fixtures/ against the TypeScript core.

import { describe, expect, it } from "vitest";
import { deepen, type ResolveContext } from "@deeper-link/core";
import gmail from "../../../spec/fixtures/gmail.json";
import googleDrive from "../../../spec/fixtures/google-drive.json";

interface Feed {
  status: number;
  body: string;
}

interface Case {
  name: string;
  url: string;
  isOpenPage?: boolean;
  pageTitle?: string;
  pageAccountLabel?: string;
  feeds?: Record<string, Feed>;
  openTabLabels?: Record<string, string>;
  openTabLookupFails?: boolean;
  expected?: string;
  error?: string;
}

/** Serves the case's Gmail feeds; any other request is a 404 so unexpected fetches fail loudly. */
function fakeFetch(feeds: Record<string, Feed> = {}): ResolveContext["fetch"] {
  return async (url) => {
    const index = url.match(/\/mail\/u\/(\d+)\/feed\/atom$/)?.[1];
    const feed = index === undefined ? undefined : feeds[index];
    return feed
      ? new Response(feed.body, { status: feed.status })
      : new Response("not found", { status: 404 });
  };
}

function contextFor(c: Case): ResolveContext {
  return {
    fetch: fakeFetch(c.feeds),
    isOpenPage: c.isOpenPage,
    pageTitle: c.pageTitle,
    pageAccountLabel: c.pageAccountLabel,
    findAccountLabel: async (index) => {
      if (c.openTabLookupFails) throw new Error("tab lookup exploded");
      return c.openTabLabels?.[index];
    },
  };
}

for (const [file, fixture] of Object.entries({ "gmail.json": gmail, "google-drive.json": googleDrive })) {
  describe(`spec/fixtures/${file}`, () => {
    for (const c of fixture.cases as Case[]) {
      it(c.name, async () => {
        const result = deepen(c.url, contextFor(c));
        if (c.error) await expect(result).rejects.toThrow(c.error);
        else await expect(result).resolves.toBe(c.expected);
      });
    }
  });
}
