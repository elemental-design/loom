# T05 — demo-ds fixtures + demo app

**Goal:** the three canonical components render in a browser via the web primitives with generated tokens, and typecheck against the augmented token types.

**Read:** `docs/spec/07-fixtures.md`. (Skim 02 only if a type error needs explaining.)

## Create (under `examples/demo-ds/`)
- `components/Button/Button.loom.tsx`, `components/Badge/Badge.loom.tsx`, `components/Catalog/Catalog.loom.tsx` — **verbatim** from 07-fixtures.
- `components/Button/Button.compositions.ts`, `Badge.compositions.ts`, `Catalog.compositions.ts` — per 07.
- `app/index.html`, `app/main.tsx`, `vite.config.ts` — imports `generated/tokens.css`, `@loom/primitives/primitives.css`, renders every composition of every component in a labeled grid (plain markup is fine; use only primitives inside components, the app chrome may use plain HTML).
- `tsconfig.json` includes `generated/tokens.ts` so the augmentation applies.
- `components/fixtures.test.tsx` — renders each component with `renderToStaticMarkup`.

## Notes
- Placeholder image: `public/placeholder.png` (any tiny valid PNG, create with a script or base64).
- Do not add Tailwind to the demo runtime. (Tailwind arrives with generated output in T08.)

## Acceptance
- `pnpm typecheck` passes with the augmentation active; a scratch edit `<Pressable background="nope">` must fail typecheck (verify manually, then revert).
- `fixtures.test.tsx`: Button primary markup contains `var(--loom-color-accent)`; Button with `icon="arrow-right"` contains `<svg`; without `icon` it doesn't; Badge `count={120}` text is `99+`; Catalog with 3 items renders 3 `<img`.
- `pnpm --filter demo-ds exec vite build` succeeds.

## Out of scope
Playwright/screenshots, Storybook, MDX, dark mode toggle.
