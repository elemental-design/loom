# Tasks

Do tasks in order. Statuses: `todo` / `done`. One task per session; commit when done: `T03: <title>`.

| ID | Title | Depends | Status |
| --- | --- | --- | --- |
| T00 | Monorepo scaffold | — | done |
| T01 | Palette generation + contrast validation | T00 | done |
| T02 | Token emitters (CSS, shadcn aliases, TS types) | T01 | done |
| T03 | Primitive shared types | T00 | done |
| T04 | Web primitives + primitives.css | T03 | done |
| T05 | demo-ds fixtures + demo app | T02, T04 | done |
| T06 | IR types, evaluator, extractor | T05 | done |
| T07 | Lint rules | T06 | done |
| T08 | Standalone web codegen + drift check | T07 | done |
| T09 | Native primitives (RN, react-sketchapp, react-figmaapp) | T04 | todo |

T01–T02 (tokens) and T03–T04 (primitives) are independent tracks after T00 and may be done in either order.

## Task file template (for adding tasks)

`Goal` · `Read` (spec files only) · `Create/Modify` (exact paths) · `Spec` (precise behavior) · `Acceptance` (commands + named tests) · `Out of scope` · `Done when`.

Keep each task under ~100 lines. If it needs more, split it.
