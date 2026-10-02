# Open questions (agents append; humans resolve)

Format: `- [T##] Question. Chose: <what you did>.` Humans move resolved items into `DECISIONS.md`.

## Pre-existing, from design phase (not blocking M0–M4)

- Slots: how much layout authority do nested `child` slots carry? (Deferred with `child` params; see 06-deferred.)
- Icon set normalization for SwiftUI/Compose (SF Symbols ↔ lucide mapping table). Needed at SwiftUI target only.
- Responsive breakpoints: lean toward per-target bindings, not spec. Needed when `viewports` land.

- T02: Spec's `generated/tokens.ts` has a bare `declare module "@loom/primitives"` augmentation, which fails typecheck (TS2664) when nothing else in the program imports that module. Chose: emit `import type {} from "@loom/primitives"` as the first line after the header. Also added `generated`, `loom.config.ts`, `loom.tokens.ts` to demo-ds tsconfig `include`, and moved `tsx` to compiler `dependencies` (config loader uses `tsx/esm/api`).
