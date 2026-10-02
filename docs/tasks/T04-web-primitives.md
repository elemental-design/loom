# T04 — Web primitives + primitives.css

**Goal:** all nine primitives render correct DOM/CSS per spec, driven only by CSS variables.

**Read:** `docs/spec/02-primitives.md` (Semantics, Package exports). Do **not** copy code from `docs/archive/` (known bugs).

## Create (under `packages/primitives/src/`)
- `web/axis-context.ts` — `AxisContext` (`"row"|"column"|"z"|"none"`, default `"none"`).
- `web/style.ts` — pure helpers: `spacingVar(k)`, `colorVar(name)`, `radiusVar(name)`, `paddingStyle(p)`, `sizeStyle(prop: AxisSize, dim: "width"|"height", parent: Axis)`, `alignStyle`, `justifyStyle`, `zAlignStyle`. All return `CSSProperties` fragments. Unit-test each exhaustively.
- `web/stack.tsx` (HStack, VStack, ZStack), `web/content.tsx` (Spacer, Divider, Text, Image, Icon), `web/pressable.tsx`, `web/role.ts` (role → ARIA attrs).
- `index.ts` — export the nine components + types.
- `primitives.css` — per spec (Pressable states, focus ring, ZStack child rule: `.loom-zstack > * { grid-area: 1 / 1 }`; ZStack root has class `loom-zstack`).
- Tests `web/*.test.tsx` using `react-dom/server` `renderToStaticMarkup` (add `react-dom` as dev dep; no jsdom, no testing-library).

## Build order
style.ts (+tests) → HStack/VStack → Text → Spacer/Divider → ZStack → Image/Icon → Pressable.

## Acceptance — assertions that must exist
- `HStack gap={2} padding={[3,4]} background="accent" cornerRadius="full"` → markup contains `display:flex`, `flex-direction:row`, `gap:var(--loom-space-2)`, `padding:var(--loom-space-3) var(--loom-space-4)`, `background:var(--loom-color-accent)`, `border-radius:var(--loom-radius-full)`.
- `padding={{left:2}}` → `padding:0 0 0 var(--loom-space-2)`.
- Fill rules: child `width="fill"` inside HStack → `flex:1 1 0` and `min-width:0`; inside VStack → `align-self:stretch`; with no parent → `width:100%`. `height="fill"` mirrors. `width={44}` → `width:44px` + `flex-shrink:0`. `"hugging"` → `fit-content`.
- ZStack: has class `loom-zstack`, `display:grid`; `alignment="bottomEnd"` sets the right place/justify values.
- CSS var names use kebab-case of the role (`textPrimary` → `--loom-color-text-primary`, `surfaceRaised` → `--loom-color-surface-raised`). Implement `kebab()` in `web/style.ts` (duplicated deliberately from the compiler; no cross-package dependency). Add a test that `colorVar("surfaceRaised")` is `var(--loom-color-surface-raised)`.
- Text: default class `loom-typography-body` and `color:var(--loom-color-text-primary)`. `lines={2}` adds `-webkit-line-clamp:2`; without `lines`, no `-webkit-box`. `role="header"` → `role="heading"` `aria-level="2"`.
- Divider horizontal vs vertical sizes; Spacer `min`.
- Image: `alt=""` when no label; `object-fit` mapping.
- Icon `name="arrow-right"` renders an `<svg>`; unknown name renders nothing and warns once (spy on `console.warn`, called once for two renders).
- Pressable renders `<button type="button" class="loom-pressable">`, `disabled` attr passes through, `direction="vertical"` → column, no `role` attribute emitted.

## Out of scope
Native implementation, animation, Tailwind, theming provider, state variants, anything not in the spec.
