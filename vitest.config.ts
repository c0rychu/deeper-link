import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirrors the `paths` entry in tsconfig.json (vitest doesn't read it).
    alias: {
      "@deeper-link/core": fileURLToPath(new URL("ts/core/src/index.ts", import.meta.url)),
    },
  },
  test: {
    include: ["ts/**/*.test.ts"],
  },
});
