import { defineTokens } from "@loom/compiler"

export default defineTokens({
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
