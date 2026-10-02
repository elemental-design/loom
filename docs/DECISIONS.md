# Decisions

Resolved during the spec review of the original notes (`docs/archive/`). Each entry: what was inconsistent or wrong, and what the spec now says. Implementers: follow the spec; this file is the "why".

## Scope

**D-01 Authoring format: TSX, not YAML.** The first note proposed YAML as source; every later note moved to TSX with the IR extracted as a byproduct. TSX wins. No hand-authored YAML anywhere.

**D-02 MVP is milestones M0–M4 only.** Notes 4 kept Figma renderer + SwiftUI + Compose + docs site + React Native in "MVP". That is ~5 products. MVP = scaffold, tokens, web primitives, extraction + lint, shadcn codegen. Everything else is in `06-deferred.md` as a stub and is **not ready for implementation** (needs its own spec first).

**D-03 React Native runtime, AI patch layer, dark mode, MDX docs, viewports, round-trip: deferred.** Cheap conventions are kept so they are easy later: token `comment` fields, deterministic generation, `loom` metadata export with stable component ids.

## Language / API surface

**D-04 Styling props take token *names* and scale *keys*, not branded values.** Notes mixed three styles (`cornerRadius="full"`, `tokens.radius.full`, branded `ColorToken`). Chosen: names as string literals (`background="accent"`, `cornerRadius="full"`) and numeric scale keys (`gap={2}`). Types come from a generated declaration-merging augmentation. Reason: trivially extractable, no `token()` helper, no brand casts, `gap={2}` type-checks (a branded `SpacingToken` would reject it).

**D-05 Spacing props are scale keys; width/height numbers are px.** Key `k` = `k × 4px` (matches Tailwind's default scale). Scale: 1,2,3,4,6,8. `gap={2}` = 8px; `width={44}` = 44px.

**D-06 `padding` shorthand is `[vertical, horizontal]` (CSS order).** Notes 5 left it ambiguous and notes 6 implied the opposite.

**D-07 Web runtime uses inline styles + CSS variables, not Tailwind classes.** Notes 6 needed a compiler-generated Tailwind `safelist` because primitives built class names at runtime. Tailwind v4 **removed** JS-config `safelist` (only `@source inline()`). Avoiding runtime class construction removes the whole problem, makes theming work with no Tailwind installed, and keeps Tailwind only where it is statically emitted: the standalone codegen output (literal class strings). Notes 6's safelist design is archived, not adopted.

**D-08 Target Tailwind v4 + current shadcn conventions.** CSS-first: tokens emitted as CSS variables plus an `@theme inline` block. No `tailwind.config.ts`. Colors are full values (hex) in vars; `/90` opacity works via v4's `color-mix`. At T02 start the agent verifies shadcn's variable names against ui.shadcn.com/docs/theming; Loom's own `--loom-*` vars are authoritative either way.

**D-09 Pressable states are built in, not per-component variants.** Hover/pressed/disabled/focus are fixed by the primitive (opacity + focus ring). Notes had `state` internal variants; those are deferred until Figma needs them.

**D-10 Components cannot use `{...rest}` spread or extend primitive prop types.** The extractor cannot resolve them. Components declare their own props explicitly. (Notes' `Button extends PressableProps` leaked `background`, `padding` etc. into the public API.)

**D-11 Helpers are inlined into the IR as expressions; closed domains are evaluated by the compiler.** Notes said "extractor inlines helpers as logic" without defining it. The IR has a tiny expression language (04-ir.md). Codegen evaluates expressions over enum domains to build variant tables.

## Bugs found in the archived notes (do not copy code from archive)

**D-12 `notes5` web implementation bugs:** `marginHorizontal` is not CSS; `axisToStyle[p.width]` indexes with numbers; invented `react-native-web-internals` import; `Text` always `display:-webkit-box`; `fill` as `width:100%` overflows siblings in a row (needs parent-axis context); ZStack via flex alignment does not overlap children (needs grid stacking); `lucideIcons` undefined; `Pressable` forced to a row; `Divider` color var `--loom-color-separator` not in palette; Badge used `align`/`width` on ZStack (not in `ZStackProps`) and `onAccent` text on a `danger` background; Catalog imported `Button` from `@loom/primitives`; cheat sheet said `VStack(gap:6)` → `spacing: 16` (should be 24); "10 primitives" but 9 listed (notes 2 said 8).

**D-13 Primitive count is 9:** HStack, VStack, ZStack, Spacer, Divider, Text, Image, Icon, Pressable.

**D-14 Naming collision:** shadcn's `accent` means "hover surface"; Loom's `accent` means "brand color" (= shadcn `primary`). The mapping is an explicit table (01-tokens.md). Loom's own Tailwind colors are namespaced `loom-*`.

**D-15 Source vs generated token files were circular in the notes** (`tokens.ts` both "source" and importing generated `palette`). Now: source is `loom.tokens.ts`; everything under `generated/` is output.

**D-16 Generated-file header has no timestamp.** Notes proposed a timestamp "for staleness checks", which makes every run a diff. Use a content hash instead.

**D-17 Contrast is verified with the real WCAG formula**, not HCT tone deltas (deltas are used only to *choose* tones; the validator measures).

**D-18 Spec "weeks" estimates dropped.** Replaced by task acceptance tests.
