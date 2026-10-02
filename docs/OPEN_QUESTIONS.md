# Open questions (agents append; humans resolve)

Format: `- [T##] Question. Chose: <what you did>.` Humans move resolved items into `DECISIONS.md`.

## Pre-existing, from design phase (not blocking M0–M4)

- Slots: how much layout authority do nested `child` slots carry? (Deferred with `child` params; see 06-deferred.)
- Icon set normalization for SwiftUI/Compose (SF Symbols ↔ lucide mapping table). Needed at SwiftUI target only.
- Responsive breakpoints: lean toward per-target bindings, not spec. Needed when `viewports` land.

- T02: Spec's `generated/tokens.ts` has a bare `declare module "@loom/primitives"` augmentation, which fails typecheck (TS2664) when nothing else in the program imports that module. Chose: emit `import type {} from "@loom/primitives"` as the first line after the header. Also added `generated`, `loom.config.ts`, `loom.tokens.ts` to demo-ds tsconfig `include`, and moved `tsx` to compiler `dependencies` (config loader uses `tsx/esm/api`).
- T05: Verbatim fixtures fail typecheck: object-literal lookups (`({ sm: 2, ... })[s]`) widen to `number`/`string`, not `SpacingKey`/`ColorName`. Chose: add `as const` to those three literals in Button/Badge (spec 03's subset should confirm `as const` is allowed). Also set demo-ds tsconfig `moduleResolution: Bundler`/`module: ESNext` because fixtures import `../Badge/Badge.loom` without extension (fails under NodeNext).
