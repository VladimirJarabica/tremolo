import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    // Mirror the tsconfig `@/*` -> `./*` path alias for tests.
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
  test: {
    include: ["**/*.test.ts"],
  },
});
