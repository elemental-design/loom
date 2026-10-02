# 01 — Tokens

## Source: `loom.tokens.ts`

```ts
import { defineTokens } from "@loom/compiler"

export default defineTokens({
  seeds: { accent: "#635BFF", neutral: "#F4F5F7", danger: "#B3261E" },
  // `comment` is REQUIRED on every role (usage context; future AI/doc consumers).
  colors: {
    surface:       { from: "neutral", tone: 99, comment: "Page background." },
    surfaceRaised: { from: "neutral", tone: 96, comment: "Cards, popovers, secondary buttons." },
    textPrimary:   { from: "neutral", tone: 15, comment: "Body text and icons on surface/surfaceRaised." },
    textMuted:     { from: "neutral", tone: 40, comment: "Secondary text. Never on accent." },
    separator:     { from: "neutral", tone: 90, comment: "Dividers and borders." },
    accent:        { from: "accent",  tone: 40, comment: "Brand/primary fill." },
    accentSoft:    { from: "accent",  tone: 90, comment: "Tinted hover/selected backgrounds." },
    onAccent:      { from: "accent",  tone: 100, comment: "Text/icons on accent." },
    danger:        { from: "danger",  tone: 40, comment: "Destructive fill." },
    onDanger:      { from: "danger",  tone: 100, comment: "Text/icons on danger." },
  },
  contrast: [ // [foreground, background, minRatio]
    ["textPrimary", "surface", 4.5], ["textPrimary", "surfaceRaised", 4.5],
    ["textMuted", "surface", 4.5],   ["textMuted", "surfaceRaised", 4.5],
    ["textPrimary", "accentSoft", 4.5],
    ["onAccent", "accent", 4.5],     ["onDanger", "danger", 4.5],
  ],
  spacing: { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 },
  radius: { sm: 6, md: 8, lg: 16, full: 999 },
  typography: {
    display:  { size: 34, line: 41, weight: 700 },
    title:    { size: 28, line: 34, weight: 600 },
    title2:   { size: 22, line: 28, weight: 600 },
    headline: { size: 17, line: 22, weight: 600 },
    body:     { size: 17, line: 22, weight: 400 },
    callout:  { size: 15, line: 20, weight: 400 },
    caption:  { size: 13, line: 18, weight: 400 },
    caption2: { size: 11, line: 13, weight: 400 },
  },
})
```

`"transparent"` is the only built-in non-role color name (value `transparent`).
Role names and spacing keys come from the object keys; they are the vocabulary components may use.

## Palette generation (deterministic)

Library: `@material/material-color-utilities`.

- For each seed: `hct = Hct.fromInt(argbFromHex(seed))`.
- Accent/danger palette: `TonalPalette.fromHueAndChroma(hct.hue, hct.chroma)`.
- Neutral palette: `TonalPalette.fromHueAndChroma(hct.hue, Math.min(hct.chroma, 8))` (keeps surfaces near-neutral).
- Role color = `palette.tone(role.tone)` → hex (`hexFromArgb`, lowercase).
- Ramps emitted for each seed (`accent`, `neutral`, `danger`), steps → tone: `50:97, 100:94, 200:87, 300:78, 400:68, 500:58, 600:48, 700:38, 800:28, 900:18`.

## Contrast validation

Real WCAG 2.x: relative luminance from sRGB hex, `ratio = (L1+0.05)/(L2+0.05)` with L1 ≥ L2. Each `contrast` entry below its min → error `LOOM010` with measured ratio **and** a suggestion (the nearest tone in steps of 1 that passes, searching away from the background). No fallback; build fails.

## Validation errors (owned codes)

| Code | Condition |
| --- | --- |
| LOOM001 | missing/empty `comment` on a role |
| LOOM002 | role references unknown seed |
| LOOM003 | tone not integer 0–100 |
| LOOM004 | invalid hex seed |
| LOOM005 | spacing keys not positive integers, or values not positive numbers |
| LOOM010 | contrast below minimum |
| LOOM011 | `contrast` references unknown role |

## Emitted files (`generated/`)

### `palette.json`
`{ "colors": { "<role>": "#rrggbb" }, "ramps": { "<seed>": { "50": "#…" } } }`

### `tokens.css`
Header comment, then:

```css
:root {
  --loom-color-<kebab-role>: #hex;          /* every role + transparent */
  --loom-ramp-<seed>-<step>: #hex;
  --loom-space-<key>: <px>px;
  --loom-radius-<name>: <px>px;
  /* shadcn aliases (table below) */
  --primary: var(--loom-color-accent);
  …
}
.loom-typography-<name> { font-size: <size>px; line-height: <line>px; font-weight: <weight>; }
@theme inline {
  --color-primary: var(--primary);               /* one per shadcn alias */
  --color-loom-<kebab-role>: var(--loom-color-<kebab-role>);   /* every role */
  --color-loom-<seed>-<step>: var(--loom-ramp-<seed>-<step>);
  --radius-sm: var(--loom-radius-sm); --radius-md: …; --radius-lg: …;
}
```

Role names are camelCase in TS and kebab-case in CSS (`surfaceRaised` → `surface-raised`).
Dark mode is out of scope; keep everything on `:root` so `[data-theme=dark]` can be added later without renames.

### shadcn alias table (authoritative)

| shadcn var | Loom role |
| --- | --- |
| `--background` | surface |
| `--foreground` | textPrimary |
| `--card`, `--popover` | surfaceRaised |
| `--card-foreground`, `--popover-foreground` | textPrimary |
| `--primary` | accent |
| `--primary-foreground` | onAccent |
| `--secondary`, `--muted` | surfaceRaised |
| `--secondary-foreground` | textPrimary |
| `--muted-foreground` | textMuted |
| `--accent` | accentSoft |
| `--accent-foreground` | textPrimary |
| `--destructive` | danger |
| `--destructive-foreground` | onDanger |
| `--border`, `--input` | separator |
| `--ring` | accent |
| `--radius` | `var(--loom-radius-md)` |

Before implementing T02, check ui.shadcn.com/docs/theming for current variable names. If stock shadcn dropped one (e.g. `--destructive-foreground`), still emit it; extra vars are harmless.

### `tokens.ts` (typed accessor + type augmentation)

```ts
// @generated …
declare module "@loom/primitives" {
  interface LoomTokens {
    color: "surface" | "surfaceRaised" | /* …all roles */ "onDanger"
    spacing: 1 | 2 | 3 | 4 | 6 | 8
    radius: "sm" | "md" | "lg" | "full"
    typography: "display" | "title" | /* … */ "caption2"
  }
}
export const tokens = { color: { surface: "surface", … }, spacing: { 1: 1, … }, radius: {…}, typography: {…} } as const
export {}
```

(`tokens` maps names to themselves; it exists for iteration/docs, components do not need it.)
