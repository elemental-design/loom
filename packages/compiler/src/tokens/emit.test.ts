import { describe, expect, test } from "vitest"
import { cpSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { buildPalette } from "./palette.js"
import { emitCss } from "./emit-css.js"
import { emitJson } from "./emit-json.js"
import { emitTs } from "./emit-ts.js"
import { buildTokens } from "./build.js"
import { loadTsModule } from "../config.js"
import type { TokensDef } from "./define.js"

const demo = resolve(fileURLToPath(import.meta.url), "../../../../../examples/demo-ds")
const load = () => loadTsModule<TokensDef>(join(demo, "loom.tokens.ts"))

describe("emitters", () => {
  test("tokens.css snapshot", async () => {
    const def = await load()
    const css = emitCss(def, buildPalette(def), "000000000000")
    await expect(css).toMatchFileSnapshot("__snapshots__/tokens.css")
  })

  test("--primary aliases accent", async () => {
    const def = await load()
    const css = emitCss(def, buildPalette(def), "h")
    expect(css).toContain("--primary: var(--loom-color-accent);")
  })

  test("every role has both var forms", async () => {
    const def = await load()
    const css = emitCss(def, buildPalette(def), "h")
    for (const role of [...Object.keys(def.colors), "transparent"]) {
      const k = role.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
      expect(css).toContain(`--loom-color-${k}:`)
      expect(css).toContain(`--color-loom-${k}:`)
    }
  })

  test("JSON keys sorted", async () => {
    const def = await load()
    const json = emitJson(def, buildPalette(def))
    const parsed = JSON.parse(json)
    expect(Object.keys(parsed)).toEqual(["colors", "ramps"])
    const colorKeys = Object.keys(parsed.colors)
    expect(colorKeys).toEqual([...colorKeys].sort())
    expect(Object.keys(parsed.ramps)).toEqual(["accent", "danger", "neutral"])
    expect(json.endsWith("}\n")).toBe(true)
  })

  test("tokens.ts has augmentation", async () => {
    const def = await load()
    const ts = emitTs(def, buildPalette(def), "h")
    expect(ts).toContain("interface LoomTokens")
    expect(ts).toContain("spacing: 1 | 2 | 3 | 4 | 6 | 8")
  })
})

describe("buildTokens", () => {
  const scratch = () => {
    const dir = mkdtempSync(join(tmpdir(), "loom-"))
    cpSync(join(demo, "loom.config.ts"), join(dir, "loom.config.ts"))
    cpSync(join(demo, "loom.tokens.ts"), join(dir, "loom.tokens.ts"))
    // resolve @loom/compiler from the scratch dir
    mkdirSync(join(dir, "node_modules"), { recursive: true })
    cpSync(join(demo, "node_modules/@loom"), join(dir, "node_modules/@loom"), { recursive: true, dereference: false })
    return dir
  }
  const read = (dir: string) =>
    ["palette.json", "tokens.css", "tokens.ts"].map((f) => readFileSync(join(dir, "generated", f), "utf8"))

  test("deterministic across runs and matches committed output", async () => {
    const dir = scratch()
    try {
      expect(await buildTokens(dir)).toEqual([])
      const first = read(dir)
      await buildTokens(dir)
      expect(read(dir)).toEqual(first)
      expect(first).toEqual(
        ["palette.json", "tokens.css", "tokens.ts"].map((f) => readFileSync(join(demo, "generated", f), "utf8")),
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("failing contrast writes nothing", async () => {
    const dir = scratch()
    try {
      const src = readFileSync(join(dir, "loom.tokens.ts"), "utf8").replace(
        'textMuted: { from: "neutral", tone: 40',
        'textMuted: { from: "neutral", tone: 80',
      )
      writeFileSync(join(dir, "loom.tokens.ts"), src)
      const diags = await buildTokens(dir)
      expect(diags.some((d) => d.code === "LOOM010")).toBe(true)
      expect(existsSync(join(dir, "generated"))).toBe(false)
      expect(readdirSync(dir)).not.toContain("generated")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
