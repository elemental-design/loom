import { defineConfig } from "@loom/compiler"

export default defineConfig({
  tokens: "./loom.tokens.ts",
  components: "./components/**/*.loom.tsx",
  out: { generated: "./generated", ir: "./.loom", web: "./dist/web" },
  web: { cnImport: "@/lib/utils", componentDir: "src/components/loom" },
})
