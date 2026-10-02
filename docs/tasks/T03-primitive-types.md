# T03 — Primitive shared types

**Goal:** `@loom/primitives` exports the type contract; types resolve correctly with and without a token augmentation.

**Read:** `docs/spec/02-primitives.md` ("Types" block only).

## Create / modify
- `packages/primitives/src/types.ts` — copy the normative block verbatim.
- `packages/primitives/src/index.ts` — `export * from "./types.js"` (components added in T04).
- `packages/primitives/src/types.test-d.ts` + vitest `typecheck` enabled (`vitest --typecheck`) or `tsc` type tests via `expectTypeOf`.

## Acceptance
Type tests (use `expectTypeOf`, vitest typecheck mode; `pnpm --filter @loom/primitives test` runs them):
- Without augmentation: `ColorName` accepts any string; `SpacingKey` accepts any number.
- With a test-local augmentation (`declare module "./types" { interface LoomTokens { color: "accent"|"surface"; spacing: 1|2|3 } }` in a separate `*.aug.test-d.ts` included only by a second tsconfig): `ColorName` is `"accent"|"surface"|"transparent"`, `SpacingKey` is `1|2|3`, `gap={4}` is a type error (`// @ts-expect-error`).
- `Padding` accepts `2`, `[2,3]`, `{ left: 2 }`; rejects `[2]` and `[2,3,4]`.
- `PressableProps` has `direction`, `onPress`, `disabled`, and **no** `role`.

## Out of scope
Any React component, CSS, runtime code.
