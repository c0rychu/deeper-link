import { gmail } from "./services/gmail";
import { DeeperLinkError, type ResolveContext, type Service } from "./types";

/** Every supported service. Add new ones here. */
export const services: readonly Service[] = [gmail];

export function findService(url: URL): Service | undefined {
  return services.find((service) => service.matches(url));
}

/** Turns a fragile link into a stable one, or throws DeeperLinkError. */
export async function deepen(rawUrl: string, ctx: ResolveContext): Promise<string> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new DeeperLinkError(`Not a valid URL: ${rawUrl}`);
  }
  const service = findService(url);
  if (!service) throw new DeeperLinkError(`Unsupported URL: ${url.origin}${url.pathname}`);
  return service.deepen(url, ctx);
}
