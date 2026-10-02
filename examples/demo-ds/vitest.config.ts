import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["components/**/*.test.ts?(x)", "src/**/*.test.ts?(x)"],
  },
})
