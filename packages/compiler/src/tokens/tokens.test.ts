import { describe, expect, test } from "vitest"
import { defineTokens, type TokensDef } from "./define.js"
import { validateTokens } from "./validate.js"
import { buildPalette, checkContrast } from "./palette.js"
import { contrastRatio, luminance } from "./contrast.js"
import { formatDiagnostic } from "../diagnostics.js"

export const specDefault: TokensDef = defineTokens({
  seeds: { accent: "#635BFF", neutral: "#F4F5F7", danger: "#B3261E" },
  colors: {
    surface: { from: "neutral", tone: 99, comment: "Page background." },
    surfaceRaised: { from: "neutral", tone: 96, comment: "Cards, popovers, secondary buttons." },
    textPrimary: { from: "neutral", tone: 15, comment: "Body text and icons on surface/surfaceRaised." },
    textMuted: { from: "neutral", tone: 40, comment: "Secondary text. Never on accent." },
    separator: { from: "neutral", tone: 90, comment: "Dividers and borders." },
    accent: { from: "accent", tone: 40, comment: "Brand/primary fill." },
    accentSoft: { from: "accent", tone: 90, comment: "Tinted hover/selected backgrounds." },
    onAccent: { from: "accent", tone: 100, comment: "Text/icons on accent." },
    danger: { from: "danger", tone: 40, comment: "Destructive fill." },
    onDanger: { from: "danger", tone: 100, comment: "Text/icons on danger." },
  },
  contrast: [
    ["textPrimary", "surface", 4.5],
    ["textPrimary", "surfaceRaised", 4.5],
    ["textMuted", "surface", 4.5],
    ["textMuted", "surfaceRaised", 4.5],
    ["textPrimary", "accentSoft", 4.5],
    ["onAccent", "accent", 4.5],
    ["onDanger", "danger", 4.5],
  ],
  spacing: { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 },
  radius: { sm: 6, md: 8, lg: 16, full: 999 },
  typography: {
    display: { size: 34, line: 41, weight: 700 },
    title: { size: 28, line: 34, weight: 600 },
    title2: { size: 22, line: 28, weight: 600 },
    headline: { size: 17, line: 22, weight: 600 },
    body: { size: 17, line: 22, weight: 400 },
    callout: { size: 15, line: 20, weight: 400 },
    caption: { size: 13, line: 18, weight: 400 },
    caption2: { size: 11, line: 13, weight: 400 },
  },
})

describe("contrast math", () => {
  test("contrastRatio black/white ≈ 21", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1)
  })

  test("contrastRatio #777777/#ffffff ≈ 4.48 (±0.02)", () => {
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2)
  })

  test("luminance is symmetric under channel inversion bounds", () => {
    expect(luminance("#ffffff")).toBeCloseTo(1, 5)
    expect(luminance("#000000")).toBeCloseTo(0, 5)
  })
})

describe("buildPalette", () => {
  test("is deterministic", () => {
    expect(buildPalette(specDefault)).toEqual(buildPalette(specDefault))
  })

  test("every role color is lowercase 6-digit hex", () => {
    const { colors } = buildPalette(specDefault)
    for (const [role, hex] of Object.entries(colors)) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/)
      void role
    }
  })

  test("ramps have 10 steps for accent/neutral/danger", () => {
    const { ramps } = buildPalette(specDefault)
    for (const seed of ["accent", "neutral", "danger"]) {
      expect(Object.keys(ramps[seed]!)).toHaveLength(10)
    }
  })
})

describe("validateTokens", () => {
  test("spec default has no validation errors", () => {
    expect(validateTokens(specDefault)).toEqual([])
  })

  test("missing comment → LOOM001", () => {
    const def: TokensDef = {
      ...specDefault,
      colors: { ...specDefault.colors, surface: { from: "neutral", tone: 99, comment: "" } },
    }
    expect(validateTokens(def).map((d) => d.code)).toContain("LOOM001")
  })

  test("unknown seed → LOOM002", () => {
    const def: TokensDef = {
      ...specDefault,
      colors: { ...specDefault.colors, surface: { from: "nope", tone: 99, comment: "x" } },
    }
    expect(validateTokens(def).map((d) => d.code)).toContain("LOOM002")
  })

  test("tone 101 → LOOM003", () => {
    const def: TokensDef = {
      ...specDefault,
      colors: { ...specDefault.colors, surface: { from: "neutral", tone: 101, comment: "x" } },
    }
    expect(validateTokens(def).map((d) => d.code)).toContain("LOOM003")
  })

  test('seed "red" → LOOM004', () => {
    const def: TokensDef = { ...specDefault, seeds: { ...specDefault.seeds, accent: "red" } }
    expect(validateTokens(def).map((d) => d.code)).toContain("LOOM004")
  })
})

describe("checkContrast", () => {
  test("spec-default tokens produce zero LOOM010", () => {
    const { colors } = buildPalette(specDefault)
    expect(checkContrast(specDefault, colors)).toEqual([])
  })

  test("textMuted tone 70 on surface → LOOM010 with ratio and suggestion", () => {
    const def: TokensDef = {
      ...specDefault,
      colors: { ...specDefault.colors, textMuted: { from: "neutral", tone: 70, comment: "Secondary text." } },
    }
    const { colors } = buildPalette(def)
    const loom010 = checkContrast(def, colors)
    expect(loom010.map((d) => d.code)).toEqual(["LOOM010", "LOOM010"])
    for (const d of loom010) {
      expect(d.message).toMatch(/\d+\.\d{2}/)
      expect(d.message).toContain("try tone")
      expect(d.file).toBe("loom.tokens.ts")
      expect(d.line).toBe(1)
      expect(d.col).toBe(1)
    }
  })

  test("formatDiagnostic produces LOOMxxx path:line:col message", () => {
    const def: TokensDef = {
      ...specDefault,
      colors: { ...specDefault.colors, textMuted: { from: "neutral", tone: 70, comment: "Secondary text." } },
    }
    const { colors } = buildPalette(def)
    const [d] = checkContrast(def, colors)
    expect(formatDiagnostic(d!)).toMatch(/^LOOM010 loom\.tokens\.ts:1:1 /)
  })
})
