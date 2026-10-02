import { resolve } from "node:path"
import { loadConfig, loadTsModule } from "../config.js"
import type { TokensDef } from "../tokens/define.js"

export interface Vocab {
  colors: ReadonlySet<string>
  spacing: ReadonlySet<string>
  radius: ReadonlySet<string>
  typography: ReadonlySet<string>
}

export function vocabFromDef(def: TokensDef): Vocab {
  return {
    colors: new Set([...Object.keys(def.colors), "transparent"]),
    spacing: new Set(Object.keys(def.spacing)),
    radius: new Set(Object.keys(def.radius)),
    typography: new Set(Object.keys(def.typography)),
  }
}

export async function loadVocab(cwd: string): Promise<Vocab> {
  const config = await loadConfig(cwd)
  return vocabFromDef(await loadTsModule<TokensDef>(resolve(cwd, config.tokens)))
}
