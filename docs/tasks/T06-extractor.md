# T06 — IR types, evaluator, extractor, `loom extract`

**Goal:** `loom extract` turns each `*.loom.tsx` into `.loom/<Name>.ir.json`, loudly rejecting anything outside the subset.

**Read:** `docs/spec/04-ir.md` (all), `docs/spec/03-authoring-and-lint.md` (all structural rules), `docs/spec/07-fixtures.md` (only to know inputs).

## Create (under `packages/compiler/src/`)
- `ir/types.ts` — verbatim from 04.
- `ir/eval.ts` — `evalExpr`, `paramsOfExpr`, `domainOf`, plus `substitute(expr, map)` used by helper inlining. JS semantics: truthiness for `&&`/`||`/`not`/`cond`; `+` is JS `+`.
- `extract/project.ts` — ts-morph project loader from config glob.
- `extract/params.ts` — props interface → `IRParam[]` (+ defaults from destructuring, JSDoc → `doc`).
- `extract/expr.ts` — TS expression node → `IRExpr` (subset only; else LOOM104 with node position).
- `extract/helpers.ts` — collect module-level pure helpers; validate shape (LOOM105); inline by substitution.
- `extract/jsx.ts` — JSX → `IRNode` (conditionals, ternary, `.map`, text-content folding, component refs resolved via imports → target file's `loom.id`).
- `extract/extract.ts` — per-file orchestration, checks LOOM106/108/109/110, hashing, deterministic JSON writer (`ir/write.ts`).
- Wire `loom extract`. Remove stale `.loom/*.ir.json` that have no source.

## Acceptance
- Unit tests for `evalExpr` (every op, lookup missing key → LOOM140, truthiness of `""`, `0`, `null`, undefined param).
- Golden tests: extracting the three demo-ds components equals committed `examples/demo-ds/.loom/*.ir.json`. **Badge output must equal the example in 04-ir.md** (apart from `hash`/`doc`). Review Button's IR by hand: `padding` prop is `{lookup:{sm:{lit:2},md:{lit:3},lg:{lit:4}}, key:{param:"size"}}`; `fg` inlines to nested `cond`.
- Negative tests (one tiny inline source each, assert exact code): spread → LOOM102, fragment → 103, template literal → 104, helper with block body → 105, `useState()` call → 106, `.map` without key → 107, no `loom` export → 108, file/function name mismatch → 109, unknown JSX tag → 110, `interface X extends Y` / prop of type `Date` → 101.
- Running twice produces no diff. Param defaults: `size = "md"` → `default: "md"`.

## Out of scope
Lint policy rules (T07), codegen, compositions extraction, watch mode, `child` params beyond extraction (accept as type `child`).
