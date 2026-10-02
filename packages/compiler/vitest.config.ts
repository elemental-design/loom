import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: { "@/lib/utils": fileURLToPath(new URL("./src/gen-web/test-cn.ts", import.meta.url)) },
  },
})
