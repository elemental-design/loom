# T09 — Native primitives (React Native, react-sketchapp, react-figmaapp)

**Status: spec draft, written outside the normal order.** `docs/spec/06-deferred.md` lists the RN runtime as "needs its own spec first". This file is that spec for the primitives only. Do it after T08, or earlier if the human says so. Before implementing, log the choices below in `docs/OPEN_QUESTIONS.md`. Do not edit `docs/spec/`.

**Goal:** the nine primitives render through a React Native-style host: real `react-native`, `react-sketchapp`, or `react-figmaapp`. They use the same props and semantics as web, with token names resolved from a theme object.

**Read:** `docs/spec/02-primitives.md` (Types, Semantics). Look at `packages/primitives/src/web/*` for the structure to mirror; do not share runtime code with it.

## Design
- One implementation, parameterized by a **host**: `{ View, Text, Image, Pressable?, StyleSheet? }`. react-sketchapp and react-figmaapp export `View`, `Text`, `Image`, `StyleSheet` with the RN API, but no `Pressable`. When a host has none, `Pressable` renders a `View`, and `onPress` is passed through as an inert prop.
- `createPrimitives(host): Primitives` in `native/create.tsx` returns the nine components. Each entry file binds a host:
  - `native/rn.ts` → `import * as RN from "react-native"`
  - `native/sketch.ts` → `import * as S from "react-sketchapp"`
  - `native/figma.ts` → `import * as F from "react-figmaapp"`
- None of these three packages is installed or added to `dependencies`. Declare them as optional `peerDependencies` (`peerDependenciesMeta.optional`). Typecheck against local ambient stubs in `src/native/host-shim.d.ts`, which declare only the members `Host` uses. Tests inject a fake host and never import the real packages.
- `Comp.sketch.tsx` / `Comp.figma.tsx` are **consumer** files. They import a `*.loom.tsx` component and call the host's `render`. Loom does not generate them; the extractor and linter only see `*.loom.tsx`, so they need no changes. Ship the example `examples/demo-ds/Badge/Badge.sketch.tsx` and `Badge.figma.tsx`, typechecked only (not run).
- **Theme:** `ThemeProvider` and `useTheme` (`native/theme.ts`, React context). `Theme = { color: Record<string,string>; space: Record<string|number,number>; radius: Record<string,number>; typography: Record<string,{fontSize:number;lineHeight?:number;fontWeight?:string;fontFamily?:string;letterSpacing?:number}> }`.
  - A missing key throws `LOOM300 <primitive>: unknown <kind> "<key>"`. It never falls back silently.
  - There is no default theme. Rendering outside a provider throws `LOOM301`.
  - Generating a `Theme` from tokens is **out of scope** (T10). Hand-written themes are fine for now.
- **Exports** in `package.json`: add `"./native"`, `"./sketch"` and `"./figma"` entries, plus a top-level `"react-native"` condition on `"."` pointing to `src/native/rn.ts`. The default web entry is unchanged.

## Create/Modify (under `packages/primitives/`)
`src/native/{create.tsx,theme.ts,style.ts,host.ts,host-shim.d.ts,rn.ts,sketch.ts,figma.ts,index.ts}`, tests `src/native/*.test.tsx`, `package.json`, `tsconfig.json` (include `src/native`), and `examples/demo-ds/Badge/Badge.{sketch,figma}.tsx`.

## Mapping (RN style objects; pure helpers in `style.ts`, unit-tested)
- **Stacks:** `flexDirection` row/column; `gap`, padding (number → all sides, `[v,h]` → `paddingVertical`/`paddingHorizontal`, object → per side, missing = 0), and `backgroundColor` from the theme. `align`/`justify` → `alignItems`/`justifyContent` (`spaceBetween → space-between`). `overflow:"hidden"` when `clip`, and `borderRadius` from the theme.
- **Size**, by parent axis, using a context like web's:
  - number → `width: N`, `flexShrink: 0`.
  - `"N%"` → string passthrough.
  - `hugging` → no dimension, `flexGrow: 0`, `flexShrink: 0`, `alignSelf: "flex-start"` on the cross axis only.
  - `fill` on the main axis → `flexGrow:1; flexShrink:1; flexBasis:0; minWidth:0` (height: `minHeight:0`).
  - `fill` on the cross axis → `alignSelf:"stretch"`.
  - `fill` in a `z`/`none` parent → `"100%"`.
- **ZStack:** `position:"relative"`. Each child is wrapped in a `View` with `position:"absolute"` plus `top/bottom/left/right` and align flex values from `alignment`. A wrapper that is `absolute` fills the container, and the alignment places the child. Sizing the container to its largest child is not possible this way; so the ZStack **requires** a numeric `width` and `height`, otherwise it throws `LOOM302`. Log this limit in OPEN_QUESTIONS.
- **Spacer:** `flexGrow:1; flexBasis:0; minWidth/minHeight` from `space[min]`, else 0.
- **Divider:** 1 on the thin axis (`StyleSheet.hairlineWidth` is not used, because Sketch/Figma lack it), `alignSelf:"stretch"`, margins from `inset`, and `backgroundColor` = `color ?? theme.color.separator`.
- **Text:** the host `Text`. Typography keys are spread into the style. `color` is from the theme. `lines` → `numberOfLines`. `align` → `textAlign` (`start→left`, `end→right`, `center`). `role="header"` → `accessibilityRole="header"`, and `label` → `accessibilityLabel`.
- **Image:** `source={{uri:src}}`, `resizeMode`, `borderRadius`, sizing as above, and `accessibilityLabel`.
- **Icon:** the host has no lucide. Render a `View` of `size×size` with `accessibilityLabel={name}` and no glyph, and warn once per name in dev: `LOOM303 Icon "<name>" has no native glyph source`. Real icon support is out of scope.
- **Pressable:** the host `Pressable` when present, with `onPress`, `disabled` and `style` `opacity: disabled ? .5 : 1`. Pressed style is `opacity .8`, applied only when the host `Pressable` supports a style function. Laid out like a stack per `direction`. Role is `accessibilityRole="button"`.

## Acceptance
`pnpm -r typecheck && pnpm -r test`. Named tests, using a fake host whose components are string-tagged `createElement`s, rendered via `react-dom/server`, or by inspecting the element tree:
1. `style.test.ts`: every helper above, including padding forms and each `fill`/`hugging`/number case across the 4 parent axes.
2. `HStack gap={2} padding={[3,4]} background="accent"` under a theme → `flexDirection:"row"`, `gap`, `paddingVertical`, `paddingHorizontal` and `backgroundColor` get the resolved numbers/strings.
3. An unknown color/space/radius/typography key → throws `LOOM300`. Rendering with no provider → `LOOM301`.
4. ZStack without numeric size → `LOOM302`; with size, 9 alignments map correctly.
5. `createPrimitives` with a host lacking `Pressable` still renders `Pressable`, and `onPress` doesn't throw.
6. Each of `rn`, `sketch` and `figma` entries exposes all nine components. Verify by mocking the three modules with `vi.mock(..., () => fakeHost)`.
7. Web entry unchanged: the existing web tests still pass, and `index.ts` doesn't import `native/`.

## Out of scope
Token → `Theme` emitter (T10). Real icons. Generating `*.sketch.tsx`/`*.figma.tsx`. Symbols/component sets, styleguide pages, variables, provenance (`pluginData`). Metro config. Installing any of the three host packages. Animation. Changes to the extractor, linter or codegen.

## Done when
Acceptance passes, `docs/tasks/README.md` lists T09 as `done`, OPEN_QUESTIONS has the choices (optional peers and shim types; no `Pressable` fallback; ZStack size requirement; Icon placeholder; `LOOM30x` codes), and the commit is `T09: native primitives`.
