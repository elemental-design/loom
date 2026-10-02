import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import type { Diagnostic } from "../diagnostics.js"
import { loadConfig, loadTsModule } from "../config.js"
import type { TokensDef } from "./define.js"
import { validateTokens } from "./validate.js"
import { buildPalette, checkContrast } from "./palette.js"
import { emitJson } from "./emit-json.js"
import { emitCss } from "./emit-css.js"
import { emitTs } from "./emit-ts.js"

export async function buildTokens(cwd: string): Promise<Diagnostic[]> {
  const config = await loadConfig(cwd)
  const file = resolve(cwd, config.tokens)
  const def = await loadTsModule<TokensDef>(file)
  const hash = createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 12)

  const diagnostics = validateTokens(def)
  if (diagnostics.some((d) => d.severity === "error")) return diagnostics

  const palette = buildPalette(def)
  diagnostics.push(...checkContrast(def, palette.colors))
  if (diagnostics.some((d) => d.severity === "error")) return diagnostics

  const dir = resolve(cwd, config.out.generated)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, "palette.json"), emitJson(def, palette))
  writeFileSync(resolve(dir, "tokens.css"), emitCss(def, palette, hash))
  writeFileSync(resolve(dir, "tokens.ts"), emitTs(def, palette, hash))
  return diagnostics
}
