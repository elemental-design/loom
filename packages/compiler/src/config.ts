import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { tsImport } from "tsx/esm/api"

export interface LoomConfig {
  tokens: string
  components: string
  out: { generated: string; ir: string; web: string }
  web: { cnImport: string; componentDir: string }
}

export function defineConfig(config: LoomConfig): LoomConfig {
  return config
}

export async function loadTsModule<T>(file: string): Promise<T> {
  const mod = await tsImport(pathToFileURL(file).href, import.meta.url)
  return (mod.default?.default ?? mod.default) as T
}

export async function loadConfig(cwd: string): Promise<LoomConfig> {
  const file = resolve(cwd, "loom.config.ts")
  if (!existsSync(file)) throw new Error(`loom.config.ts not found in ${cwd}`)
  return loadTsModule<LoomConfig>(file)
}
