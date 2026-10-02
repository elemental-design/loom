import { Hct, TonalPalette, hexFromArgb, argbFromHex } from "@material/material-color-utilities"
import type { TokensDef } from "./define.js"
import type { Diagnostic } from "../diagnostics.js"
import { TOKENS_FILE, TOKENS_POS } from "./validate.js"
import { contrastRatio } from "./contrast.js"

const RAMP_TONES: Record<string, number> = {
  "50": 97,
  "100": 94,
  "200": 87,
  "300": 78,
  "400": 68,
  "500": 58,
  "600": 48,
  "700": 38,
  "800": 28,
  "900": 18,
}

export interface Palette {
  colors: Record<string, string>
  ramps: Record<string, Record<string, string>>
}

function palettesFor(def: TokensDef): Record<string, TonalPalette> {
  const palettes: Record<string, TonalPalette> = {}
  for (const [name, seed] of Object.entries(def.seeds)) {
    const hct = Hct.fromInt(argbFromHex(seed))
    const chroma = name === "neutral" ? Math.min(hct.chroma, 8) : hct.chroma
    palettes[name] = TonalPalette.fromHueAndChroma(hct.hue, chroma)
  }
  return palettes
}

export function buildPalette(def: TokensDef): Palette {
  const palettes = palettesFor(def)

  const colors: Record<string, string> = {}
  for (const [role, roleDef] of Object.entries(def.colors)) {
    colors[role] = hexFromArgb(palettes[roleDef.from]!.tone(roleDef.tone)).toLowerCase()
  }

  const ramps: Record<string, Record<string, string>> = {}
  for (const [name, palette] of Object.entries(palettes)) {
    const ramp: Record<string, string> = {}
    for (const [step, tone] of Object.entries(RAMP_TONES)) {
      ramp[step] = hexFromArgb(palette.tone(tone)).toLowerCase()
    }
    ramps[name] = ramp
  }

  return { colors, ramps }
}

export function checkContrast(def: TokensDef, colors: Record<string, string>): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const palettes = palettesFor(def)

  for (const [fg, bg, min] of def.contrast) {
    const fgColor = colors[fg]
    const bgColor = colors[bg]
    if (fgColor === undefined || bgColor === undefined) continue
    const ratio = contrastRatio(fgColor, bgColor)
    if (ratio >= min) continue

    const fgRole = def.colors[fg]
    const bgRole = def.colors[bg]
    let suggestion: string | undefined
    if (fgRole && bgRole) {
      const dir = fgRole.tone >= bgRole.tone ? 1 : -1
      for (let d = 1; d <= 100; d++) {
        const t = fgRole.tone + dir * d
        if (t < 0 || t > 100) break
        const candColor = hexFromArgb(palettes[fgRole.from]!.tone(t)).toLowerCase()
        if (contrastRatio(candColor, bgColor) >= min) {
          suggestion = `try tone ${t}`
          break
        }
      }
    }
    const message =
      `contrast ${fg} on ${bg} is ${ratio.toFixed(2)}, minimum ${min}` +
      (suggestion ? ` (${suggestion})` : " (no passing tone in 0–100)")
    diagnostics.push({
      code: "LOOM010",
      severity: "error",
      file: TOKENS_FILE,
      line: TOKENS_POS.line,
      col: TOKENS_POS.col,
      message,
    })
  }
  return diagnostics
}
