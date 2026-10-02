# T07 — Lint rules + `loom lint`

**Goal:** policy rules LOOM201–210 over source + IR, with positions.

**Read:** `docs/spec/03-authoring-and-lint.md` ("Lint rules" and definition of style props / resolved value set), `docs/spec/04-ir.md` (evaluator), `docs/spec/01-tokens.md` (only to know the vocabulary comes from `generated/palette.json` + the tokens def).

## Create (under `packages/compiler/src/lint/`)
- `vocab.ts` — `loadVocab(cwd)`: color names (roles + `transparent`), spacing keys, radius names, typography names, from the tokens definition.
- `rules/*.ts` — one file per rule exporting `(ctx) => Diagnostic[]`; `ctx` has the IR, ts-morph source file (for positions), vocab, and sibling IRs.
- `style-props.ts` — the table of which props are style/content/token-kind (single source; T08 reuses it).
- `lint.ts` — run all rules, merge, sort, return. Wire `loom lint` (extracts in memory first; extraction errors are reported and abort).
- IR nodes need source positions for diagnostics: keep a side map `nodeId → {line,col}` produced by the extractor (do **not** add positions to IR JSON; modify T06 code minimally to return the map).

## Acceptance
Positive: the three demo components lint clean (LOOM206 warnings allowed only if none apply; Catalog's 44 is a multiple of 4 → none expected).
Negative tests (inline sources, assert code + line):
- `background="#fff"` → LOOM202; `background="nope"` → 203 (also via a helper returning `"nope"` in one branch).
- `gap={5}` → 204 (not in scale); `cornerRadius="huge"` → 204.
- `<Text color={someStringParam}>` → 205; `gap={item.n}` inside `.map` → 205.
- `width={22}` → LOOM206 **warning**, exit code 0.
- A style prop using both `size` and `intent` → 207.
- Two components with same `loom.id` → 208 (reported on the second).
- `<Icon name={"ar" + x} />` → 209; `<Icon name={icon} />` (icon-typed param) → clean.
- Import from `"lodash"` → 201 (lint is the sole owner of import policy; the extractor does not check imports except to resolve loom component refs).
- `loom lint` exits 1 on any error, 0 with only warnings.

## Out of scope
Auto-fix, config for rule severity, ESLint plugin.
