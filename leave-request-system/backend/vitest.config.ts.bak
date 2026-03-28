// leave-request-system/backend/vitest.config.ts
import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    testTimeout: 30_000,
    hookTimeout: 60_000,
    include: ["test/**/*.test.{js,ts}"],
    fileParallelism: false, // integration tests share a Nuxt server on port 3001 — must run serially
  },
});
