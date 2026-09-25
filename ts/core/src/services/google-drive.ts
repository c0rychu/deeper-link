// Google Drive and Docs editors: /u/N/ or ?authuser=N (sign-in order) → ?authuser=<email>. See spec/google-drive.md.

import { DeeperLinkError, type Service } from "../types";
import { ACCOUNT_SEGMENT, accountEmail, accountNumber, emailFromAccountLabel, namesAccount, stableQuery } from "./google-account";

const HOSTS = new Set(["drive.google.com", "docs.google.com"]);

export const googleDrive: Service = {
  id: "google-drive",

  matches: (url) => HOSTS.has(url.hostname),

  async deepen(url, ctx) {
    const index = accountNumber(url);
    if (index === undefined) return url.href;
    // An open Drive/Docs page often runs as a non-default account without saying so in its URL; only its account
    // button knows. Never guess the default then: a wrong link is worse than an error.
    if (ctx.isOpenPage && !namesAccount(url) && !emailFromAccountLabel(ctx.pageAccountLabel)) {
      throw new DeeperLinkError(
        "Couldn't tell which Google account this page is using. Please report it at github.com/c0rychu/deeper-link/issues",
      );
    }
    const email = await accountEmail(index, ctx);
    const path = url.pathname.replace(ACCOUNT_SEGMENT, "");
    return `${url.origin}${path}${stableQuery(url, email)}${url.hash}`;
  },
};
