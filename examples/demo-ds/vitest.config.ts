import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom", "react-test-renderer"],
    alias: {
      "@loom/primitives/figma": path.resolve(__dirname, "components/fork-primitives.ts"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react-test-renderer": path.resolve(
        __dirname,
        "node_modules/react-test-renderer",
      ),
    },
  },
  test: {
    setupFiles: ["./vitest.setup.ts"],
    server: {
      deps: {
        inline: [/react-sketchapp2/, /react-test-renderer/],
      },
    },
  },
});
