# AGENTS.md — Loom

Loom: author UI components once in TSX against a small set of SwiftUI-shaped primitives; a compiler emits tokens, an IR, and standalone shadcn/Tailwind components. (Figma, SwiftUI, Compose come later — see `docs/spec/06-deferred.md`.)

## How to work (read this first, then stop reading)

1. Open `docs/tasks/README.md`. Pick the first task whose status is `todo` and whose dependencies are `done`.
2. Read **only** that task file and the spec files its `Read:` line names. Do not read other docs "for context".
3. Do **not** read `docs/archive/`. It is superseded and contains known-wrong code.
4. Implement exactly the task's scope. Anything under `Out of scope` is forbidden, even if it looks easy.
5. Run the task's `Acceptance` commands. All must pass. Then set the task to `done` in `docs/tasks/README.md` and commit (`T03: shared primitive types`).
6. One task per session. Stop after committing.

## If the spec is unclear or wrong

Do not guess silently and do not edit anything under `docs/spec/` or `docs/DECISIONS.md`.
Pick the simplest interpretation that satisfies the acceptance tests, then append one entry to `docs/OPEN_QUESTIONS.md` (task id, question, what you chose). If it blocks you entirely, stop and report.

## Invariants (never violate)

- Components import **only** from `@loom/primitives` (plus React types and other `*.loom.tsx` components). No raw `div`/`View`, no raw hex colors, no raw px for gap/padding/radius.
- Styling values are **token names / scale keys** (`background="accent"`, `gap={2}`), never branded values or raw numbers (except `width`/`height` px).
- Helper functions in components are pure expression-bodied arrows from the restricted subset in `docs/spec/03-authoring-and-lint.md`.
- Every generated file starts with the `@generated` header and is never hand-edited. Generation is deterministic (sorted keys, no timestamps, trailing newline).
- Layout values must be statically resolvable. Unresolvable → compile error, never silent fallback.
- Compiler diagnostics are loud and structured: `LOOMxxx path:line:col message`. Never silently drop unsupported syntax.

## Conventions

- TypeScript strict, ESM only, Node ≥ 22, pnpm workspaces, vitest. No other test runner, no lint framework changes.
- File names: `kebab-case.ts` for modules; `Name.loom.tsx` for components.
- Keep dependencies to those named in the task. Ask (via OPEN_QUESTIONS) before adding one.
- Comments: only for non-obvious "why". No decorative headers.
- Never run `git push`, never rewrite history, never touch files outside the task's `Create/Modify` list except to fix a typecheck break you caused.

## Repo map

```
AGENTS.md                this file
docs/spec/               the spec (source of truth); small files, one concern each
docs/tasks/              self-contained implementation tasks (T00…)
docs/DECISIONS.md        why the spec says what it says (do not re-litigate)
docs/OPEN_QUESTIONS.md   agents append here
docs/archive/            superseded notes — ignore
packages/primitives/     @loom/primitives (types + web implementation)
packages/compiler/       @loom/compiler (`loom` CLI: tokens, extract, lint, gen)
examples/demo-ds/        the reference design system; also the test fixture
```
