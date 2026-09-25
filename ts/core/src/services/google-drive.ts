// Google Drive and Docs editors: /u/N/ or ?authuser=N (sign-in order) → ?authuser=<email>. See spec/google-drive.md.

import type { Service } from "../types";
import { accountEmail, accountNumber, hasEmailAuthuser, stableQuery } from "./google-account";

const HOSTS = new Set(["drive.google.com", "docs.google.com"]);

export const googleDrive: Service = {
  id: "google-drive",

  matches: (url) => HOSTS.has(url.hostname),

  async deepen(url, ctx) {
    if (hasEmailAuthuser(url)) return url.href;
    const email = await accountEmail(accountNumber(url) ?? 0, ctx);
    const path = url.pathname.replace(/\/u\/\d+(?=\/|$)/, "");
    return `${url.origin}${path}${stableQuery(url, email)}${url.hash}`;
  },
};
