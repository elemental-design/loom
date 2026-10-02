import type { TokensDef } from "./define.js"
import type { Palette } from "./palette.js"
import { header } from "./emit-css.js"

const union = (xs: string[]): string => (xs.length ? xs.join(" | ") : "never")
const str = (xs: string[]): string[] => xs.map((x) => JSON.stringify(x))

export function emitTs(def: TokensDef, palette: Palette, hash: string): string {
  const colors = [...Object.keys(palette.colors), "transparent"]
  const spacing = Object.keys(def.spacing)
  const radius = Object.keys(def.radius)
  const typography = Object.keys(def.typography)
  const ident = (k: string): string => (/^[A-Za-z_$][\w$]*$|^\d+$/.test(k) ? k : JSON.stringify(k))
  const self = (ks: string[], lit: (k: string) => string): string =>
    `{ ${ks.map((k) => `${ident(k)}: ${lit(k)}`).join(", ")} }`

  return [
    `// ${header(hash)}`,
    'import type {} from "@loom/primitives"',
    'declare module "@loom/primitives" {',
    "  interface LoomTokens {",
    `    color: ${union(str(colors))}`,
    `    spacing: ${union(spacing)}`,
    `    radius: ${union(str(radius))}`,
    `    typography: ${union(str(typography))}`,
    "  }",
    "}",
    "export const tokens = {",
    `  color: ${self(colors, (k) => JSON.stringify(k))},`,
    `  spacing: ${self(spacing, (k) => k)},`,
    `  radius: ${self(radius, (k) => JSON.stringify(k))},`,
    `  typography: ${self(typography, (k) => JSON.stringify(k))},`,
    "} as const",
    "export {}",
    "",
  ].join("\n")
}
