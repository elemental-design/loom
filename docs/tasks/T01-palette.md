# T01 — Palette generation + contrast validation

**Goal:** pure functions that turn a `loom.tokens.ts` definition into validated hex colors and ramps.

**Read:** `docs/spec/01-tokens.md` (Source, Palette generation, Contrast validation, Validation errors). Diagnostics format: `docs/spec/00-overview.md`.

## Create (all under `packages/compiler/src/tokens/`)
- `define.ts` — `defineTokens(def)` (identity function, typed). Export types `TokensDef`, `ColorRole`. Re-export `defineTokens` from `src/index.ts`.
- `validate.ts` — `validateTokens(def): Diagnostic[]` implementing LOOM001–005, LOOM011 (not 010).
- `palette.ts` — `buildPalette(def): { colors: Record<string,string>; ramps: Record<string, Record<string,string>> }` per spec (HCT; neutral chroma cap 8; lowercase hex).
- `contrast.ts` — `luminance(hex)`, `contrastRatio(a,b)`, `checkContrast(def, colors): Diagnostic[]` (LOOM010 with measured ratio and suggested tone).
- `diagnostics.ts` (shared, in `src/diagnostics.ts`) — `type Diagnostic = {code, severity, file, line, col, message}`, `formatDiagnostic()`.
- Tests alongside (`*.test.ts`).

## Behavior details
- `file/line/col` for token diagnostics: use `loom.tokens.ts` and line 1 col 1 (no AST needed).
- Suggestion search for LOOM010: step the failing foreground role's tone ±1 away from the background's tone until ratio passes; report `"try tone N"`; if none passes in 0–100, say so.
- Use the **default accent seed `#635BFF` and neutral `#F4F5F7`, danger `#B3261E`** from the spec as the golden input.

## Acceptance (`pnpm --filter @loom/compiler test`)
Named tests must exist and pass:
- `contrastRatio("#000000","#ffffff")` ≈ 21; `("#777777","#ffffff")` ≈ 4.48 (±0.02).
- `buildPalette(spec default)` is deterministic: two calls deep-equal; every role matches `/^#[0-9a-f]{6}$/`; ramps have 10 steps each for accent/neutral/danger.
- Spec-default tokens produce **zero** LOOM010. If any contrast pair fails, report it in OPEN_QUESTIONS and adjust *only the tone in the test fixture*, not the algorithm.
- A def with a missing `comment` → LOOM001; unknown seed → LOOM002; tone 101 → LOOM003; seed `"red"` → LOOM004.
- A def with `textMuted` tone 70 on `surface` → LOOM010 whose message contains a ratio and "try tone".

## Out of scope
Writing files, CSS, CLI wiring (T02). Dark mode.
