import type { TokensDef } from "./define.js"
import type { Palette } from "./palette.js"

const sortKeys = (v: unknown): unknown =>
  v && typeof v === "object"
    ? Object.fromEntries(
        Object.entries(v)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([k, x]) => [k, sortKeys(x)]),
      )
    : v

export function emitJson(_def: TokensDef, palette: Palette): string {
  return JSON.stringify(sortKeys({ colors: palette.colors, ramps: palette.ramps }), null, 2) + "\n"
}
