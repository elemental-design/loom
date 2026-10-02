import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    typecheck: {
      enabled: true,
      include: ["src/**/*.test-d.ts"],
      exclude: ["src/**/*.aug.test-d.ts"],
      tsconfig: "./tsconfig.json",
    },
  },
})
