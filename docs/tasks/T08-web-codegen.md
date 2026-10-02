# T08 — Standalone web codegen + drift check

**Goal:** `loom gen web [--check]` emits dependency-light shadcn/Tailwind v4 components from IR.

**Read:** `docs/spec/05-web-codegen.md` (all), `docs/spec/04-ir.md` (evaluator section), `docs/spec/03-authoring-and-lint.md` (style prop definitions only; reuse `lint/style-props.ts`).

## Create (under `packages/compiler/src/gen-web/`)
- `maps.ts` — all class tables from 05 as data + pure functions (`gapClass`, `paddingClasses`, `sizeClass(prop,dim,parentAxis)`, `colorClass(prefix,name)`, `typographyClasses`, `zAlignClasses`…). Missing mapping → throw `LOOM301`.
- `classes.ts` — per node: split props into static / variant-dependent (algorithm steps 1–5), returning `{ base: string[], variants: Record<param, Record<value, string[]>> }`. Class tokens sorted alphabetically, deduped.
- `emit-expr.ts` — IRExpr → TSX expression string (content props, `when`, `repeat`).
- `emit-node.ts`, `emit-component.ts` — JSX + cva declarations + props interface + header.
- `gen.ts` — read `.loom/*.ir.json`, generate, write (or `--check`). Format output with a tiny deterministic printer you write (2-space indent, double quotes, no semicolons); do **not** add prettier.
- Wire `loom gen web`. Output to `examples/demo-ds/dist/web/src/components/loom/*.tsx`; commit it.
- Tests under `gen-web/*.test.ts`.

## Acceptance
- Badge output equals the normative example in 05 **as a class-set comparison** (parse class strings, compare sets) and exact structure; additionally the whole-file output is committed as a golden and compared byte-for-byte thereafter.
- Button: `buttonVariants` has `intent` (4 values) and `size` (3 values) variant groups on the root; the Icon node gets its own cva with `size` + `intent` groups; `hover:opacity-90`/`disabled:opacity-50` present; root padding classes `p-2|p-3|p-4`; `intent.ghost` background → `bg-transparent`.
- Catalog: HStack child `width="fill"` inside VStack → `self-stretch`; inside HStack → `flex-1 min-w-0`; `Divider` → `role="separator"`; `.map` emits `key`; `Badge`/`Button` imported from sibling generated files (`./badge`, `./button`) with props passed through.
- Typecheck: a test sets up a temp project (react, class-variance-authority, lucide-react types from devDeps, a stub `@/lib/utils` exporting `cn`) and runs `tsc --noEmit` over the generated files. Must pass.
- Render test: `renderToStaticMarkup(<Button label="Go" />)` from the generated file contains `bg-primary` and `rounded-full`.
- `--check`: passes on a clean tree; after mutating a generated file, exits 1 with LOOM320; after deleting an IR, an orphaned generated file triggers LOOM320.
- Running `loom tokens build && loom extract && loom gen web` on demo-ds leaves no git diff.

## Out of scope
`child` params (emit LOOM301), compound variants, forwardRef, `bindTo`, Tailwind config/safelist, dark mode, CSS output.
