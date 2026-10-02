# 03 — Authoring rules and lint

Applies to every `*.loom.tsx`. The extractor (T06) enforces structural rules (LOOM1xx); lint (T07) enforces policy rules (LOOM2xx). Both are fatal unless marked `warn`.

## File shape

- One component per file `Name.loom.tsx`, exported function `Name` (PascalCase, equals file stem).
- `export interface NameProps { … }` — own members only; no `extends` (D-10).
- `export const loom = { id: "cmp_<snake_name>", version: "1.0.0" } as const` — required, `id` unique across project.
- Optional JSDoc on the component and on each prop → IR `doc`.

## Allowed prop types → IR param types

| TS | IR |
| --- | --- |
| `string` | `string` |
| `number` | `number` |
| `boolean` | `boolean` |
| union of string literals (or a type alias to one) | `enum` (values in declaration order) |
| `IconName` | `icon` |
| `() => void` | `action` |
| `ReactNode` | `child` (accepted but codegen for `child` is deferred: LOOM301) |
| `{ field: string\|number\|boolean … }[]` | `array` of object with primitive fields |

Anything else → `LOOM101`. Defaults come from literal initializers in the destructuring pattern; `required` = no `?`.

## Allowed code in the component body

The body is exactly: one destructuring of props, optional `const` pure helpers (module level, below or above), and one `return <JSX/>`.

JSX allowed:
- Primitive elements and other loom components, with explicit attributes only (**no spread**, `LOOM102`).
- Attribute values: literals; `{param}`; pure-helper calls; the expression subset below.
- Children: nested elements; `{expr}` (text content, only inside `Text`); `{cond && <El/>}`; `{cond ? <A/> : <B/>}`; `{list.map((item) => <El key={…}/>)}` where `list` is an `array` param.
- Fragments: not allowed (`LOOM103`).

### Expression subset (shared by attributes, `when`, helper bodies)

literals (string/number/boolean/null); param or loop-var identifiers; member access `a.b`; `!`, `===`, `!==`, `<`, `>`, `<=`, `>=`, `&&`, `||`, `+`; ternary `?:`; `String(x)`; **object-literal lookup** `({ a: 1, b: 2 })[x]`; `as` casts (ignored); calls to pure helpers.

Anything else (template literals, `Math.*`, `.length`, `.filter`, arithmetic other than `+`, spreads, `new`, optional chaining, async) → `LOOM104`. (`.length` and `*` may be added later; do not add now.)

### Pure helper

Module-level `const name = (a: T, …): R => <expression>` — expression body only, expression subset only, no block bodies, no references to anything except its own params, literals, and other pure helpers. Helpers are inlined into the IR (04-ir.md). Violations → `LOOM105`.

Banned anywhere in a loom file: `useState`/`useEffect`/any hook call, refs, classes, `async`, `try`, `throw`, loops, `let`/`var` (`LOOM106`). Import policy is **not** an extractor concern; lint owns it (LOOM201).

## Lint rules (T07)

| Code | Rule |
| --- | --- |
| LOOM201 | Import from anything other than `@loom/primitives`, `react` (type-only), or relative `*.loom` files |
| LOOM202 | Raw color: any string matching `#hex`, `rgb(`, `hsl(`, `oklch(` anywhere in a loom file |
| LOOM203 | Color-typed prop (`background`, `color`) whose resolved value set contains a name not in the token vocabulary |
| LOOM204 | `gap`/`padding`/`inset`/`min` resolved value not a spacing key; `cornerRadius` not a radius name; `typography` not a typography name |
| LOOM205 | Layout/token prop value is not statically resolvable (depends on a non-closed param such as `string`/`number`, or a loop var). Closed = literal, enum param, boolean param, or helper over those |
| LOOM206 | `warn`: `width`/`height` px number not a multiple of 4 ("off-scale") |
| LOOM207 | A style prop expression depends on **more than one** enum/boolean param (compound variants are deferred) |
| LOOM208 | Duplicate `loom.id` across project |
| LOOM209 | `Icon name` not a literal or closed expression (icon names must be statically known) — except when it is a direct `icon`-typed param passthrough, which is allowed |
| LOOM210 | Exported component missing `loom` metadata |

Style props = every prop of Stack/ZStack/Pressable/Divider/Spacer except `role`, `label`, `onPress`, `disabled`; plus `Text.typography/color/lines/align`, `Icon.size/color`, `Image.width/height/resizeMode/cornerRadius`. Content props (`Text` children, `Image.src`, `label`, `Icon.name`) may depend on any param.

"Resolved value set" = evaluate the expression over the cartesian product of the closed params' domains (enum values; `true/false` for boolean) using `evalExpr` from the compiler's shared evaluator.
