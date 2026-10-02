# 02 — Primitives

Nine primitives: `HStack VStack ZStack Spacer Divider Text Image Icon Pressable`. Deferred: `ScrollView Grid TextField`.

## Types (`packages/primitives/src/types.ts`) — normative

```ts
import type { ReactNode } from "react"

// Augmented by the consumer's generated/tokens.ts (declaration merging).
export interface LoomTokens {}
type Pick_<K extends string, F> = LoomTokens extends Record<K, infer V> ? V : F

export type ColorName = Pick_<"color", string> | "transparent"
export type SpacingKey = Pick_<"spacing", number>
export type RadiusName = Pick_<"radius", string>
export type TypographyName = Pick_<"typography", string>
export type IconName = string // lucide kebab-case name, e.g. "arrow-right"

export type AxisSize = "hugging" | "fill" | number | `${number}%` // number = px
export type CrossAlign = "start" | "center" | "end" | "stretch"
export type MainJustify = "start" | "center" | "end" | "spaceBetween"
export type Role = "button" | "header" | "image" | "list" | "listitem" | "text" | "none"
export type Padding =
  | SpacingKey
  | [vertical: SpacingKey, horizontal: SpacingKey]
  | { top?: SpacingKey; right?: SpacingKey; bottom?: SpacingKey; left?: SpacingKey }

export interface StackProps {
  gap?: SpacingKey
  padding?: Padding
  width?: AxisSize
  height?: AxisSize
  align?: CrossAlign      // cross axis, default "stretch"
  justify?: MainJustify   // main axis, default "start"
  background?: ColorName
  cornerRadius?: RadiusName
  clip?: boolean
  role?: Role
  label?: string
  children?: ReactNode
}
export type HStackProps = StackProps
export type VStackProps = StackProps

export type ZAlignment =
  | "topStart" | "top" | "topEnd" | "start" | "center" | "end"
  | "bottomStart" | "bottom" | "bottomEnd"
export interface ZStackProps {
  alignment?: ZAlignment  // default "center"
  width?: AxisSize
  height?: AxisSize
  background?: ColorName
  cornerRadius?: RadiusName
  clip?: boolean
  role?: Role
  label?: string
  children?: ReactNode
}
export interface SpacerProps { min?: SpacingKey }
export interface DividerProps { axis?: "horizontal" | "vertical"; inset?: SpacingKey; color?: ColorName }
export interface TextProps {
  children?: ReactNode
  typography?: TypographyName   // default "body"
  color?: ColorName             // default "textPrimary"
  lines?: number
  align?: "start" | "center" | "end"
  role?: "header" | "text"
  label?: string
}
export interface ImageProps {
  src: string
  width?: AxisSize
  height?: AxisSize
  resizeMode?: "cover" | "contain" | "fill"  // default "cover"
  cornerRadius?: RadiusName
  label?: string                              // alt text; absent = decorative
}
export interface IconProps { name: IconName; size?: number /* px, default 20 */; color?: ColorName /* default textPrimary */ }
export interface PressableProps extends Omit<StackProps, "role"> {
  direction?: "horizontal" | "vertical"       // default "horizontal"
  onPress?: () => void
  disabled?: boolean
}
```

## Semantics (all targets must agree; web shown)

**Spacing/colors/radii** resolve to CSS vars: `gap={2}` → `gap: var(--loom-space-2)`; `background="accent"` → `var(--loom-color-accent)`; `cornerRadius="full"` → `var(--loom-radius-full)`; `"transparent"` → `transparent`.

**Padding:** number → all sides; `[v,h]` → `padding: v h`; object → per side (missing = 0).

**Stacks:** `display:flex`; `HStack` row, `VStack` column; `align`/`justify` map to `align-items`/`justify-content` (`start→flex-start`, `end→flex-end`, `spaceBetween→space-between`). `box-sizing: border-box`; `min-width:0`.

**Size (`width`/`height`)** depends on the *parent axis*, provided via React context (`"row" | "column" | "z" | "none"`; default `"none"`). Stack/Pressable/ZStack set the context for children.

| value | rule |
| --- | --- |
| number | `width: Npx; flex-shrink: 0` |
| `"N%"` | `width: N%` |
| `"hugging"` | `width: fit-content; flex: 0 0 auto` on that axis |
| `"fill"` along parent's main axis | `flex: 1 1 0; min-width:0` (height: `min-height:0`) |
| `"fill"` along parent's cross axis | `align-self: stretch` |
| `"fill"`, parent `z` or `none` | `100%` |

(Width is the main axis in a row parent; height is the main axis in a column parent.)

**ZStack:** `display:grid; position:relative`; every direct child gets `grid-area: 1 / 1` (wrap each child in a `div` with `display:contents`-free `grid-area:1/1`, or apply via a `> *` rule in `primitives.css`). `alignment` → `place-items` / `justify-items` + `align-items` per the 9 positions; children keep intrinsic size.

**Spacer:** `flex: 1 1 0`; `min-width`/`min-height` = `var(--loom-space-<min>)` if set, else 0.

**Divider:** horizontal: `height:1px; align-self:stretch; flex-shrink:0; margin-inline: inset`. Vertical: `width:1px; align-self:stretch; margin-block: inset`. Background `color ?? separator`.

**Text:** `<span class="loom-typography-<name>">`; `color` inline; `lines` → line-clamp (`display:-webkit-box` **only** when `lines` set); `align` → `text-align` (`start|center|end`); `role="header"` → `role="heading" aria-level=2`; `label` → `aria-label`.

**Image:** `<img>`, `object-fit` from `resizeMode`, `alt = label ?? ""`, sizing as above, `cornerRadius` + `overflow:hidden`.

**Icon:** `lucide-react` `icons` map; convert kebab → PascalCase; render with `size`, `color` (via `currentColor` + inline color), `strokeWidth=2`, `aria-hidden`. Unknown name: render nothing and `console.warn` once per name (dev only).

**Pressable:** `<button type="button">` with `class="loom-pressable"`, style reset (`border:0; font:inherit; text-align:inherit; cursor:pointer; background` from prop), laid out like a stack per `direction`. `role` omitted (native button). `label` → `aria-label`. `disabled` → `disabled`.
`primitives.css` (static, shipped by the package, imported by consumers):
`.loom-pressable:hover:not(:disabled){opacity:.9}` `:active:not(:disabled){opacity:.8}` `:disabled{opacity:.5;cursor:default}` `:focus-visible{outline:2px solid var(--loom-color-accent);outline-offset:2px}` plus the ZStack child rule.

**Role mapping to ARIA:** `button→button`, `header→heading (aria-level 2)`, `image→img`, `list→list`, `listitem→listitem`, `text→(none)`, `none→presentation`.

## Package exports

`src/index.ts` re-exports: all nine components, all types, and nothing else. CSS at `@loom/primitives/primitives.css`. Peer deps: `react`, `lucide-react`.
