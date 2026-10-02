# Loom Primitives: Reference Catalog + Implementations

The complete primitive surface, with working reference implementations and cross-target mappings. The primitive set stays at **10 components** — deliberately SwiftUI-shaped so the mental model transfers, and deliberately minimal so every one is implementable in all four targets with no fidelity gaps.

---

## 1. The Primitive Catalog

### Layout (containers)

| Primitive | Signature | Purpose |
| --- | --- | --- |
| `HStack` | `{ gap?, padding?, align?, justify?, width?, height?, background?, cornerRadius?, children }` | Horizontal flex row |
| `VStack` | same as HStack | Vertical flex column |
| `ZStack` | `{ alignment?, width?, height?, background?, children }` | Overlapping children (no gap/padding — use child offsets) |
| `Spacer` | `{ min?: number }` | Expands to fill available axis (`flex: 1`) |
| `Divider` | `{ axis?, inset?, color? }` | Hairline separator, horizontal or vertical |

### Content (leaves)

| Primitive | Signature | Purpose |
| --- | --- | --- |
| `Text` | `{ children, typography?, color?, lines?, align?, role?, label? }` | Styled text; `typography` is a semantic role name |
| `Image` | `{ src, width?, height?, resizeMode?, cornerRadius?, label? }` | Remote or imported image |
| `Icon` | `{ name, size?, color? }` | Named glyph from icon token set |
| `Pressable` | `{ onPress?, role?, label?, disabled?, ...stack props, children }` | Tappable container — the only interactive primitive |

### Deferred (Phase 8+, needs per-target design work)

`ScrollView`, `Grid`, `TextField` (interactive input state is a different beast than the stateless MVP set).

---

## 2. Shared Types (`primitives/src/types.ts`)

This is the contract all three implementations must satisfy — written once, imported everywhere.

```ts
// prims
import type { ReactNode, CSSProperties } from "react"

// ── Token references ─────────────────────────────────────────────
// Components never use raw values — only these branded types.
// The token() helper is compile-time checked against tokens.ts.
export type ColorToken = string & { readonly __brand: "ColorToken" }
export type SpacingToken = number & { readonly __brand: "SpacingToken" }
export type RadiusToken = string & { readonly __brand: "RadiusToken" }
export type TypographyToken =
  | "display" | "title" | "title2" | "headline"
  | "body" | "callout" | "caption" | "caption2"
export type IconName = string & { readonly __brand: "IconName" }

// ── Layout ───────────────────────────────────────────────────────
export type AxisSize = "hugging" | "fill" | number | `${number}%`
export type CrossAlign = "start" | "center" | "end" | "stretch"
export type MainJustify = "start" | "center" | "end" | "spaceBetween"
export type Padding =
  | SpacingToken
  | { top?: SpacingToken; bottom?: SpacingToken; left?: SpacingToken; right?: SpacingToken }
export type SpacingShorthand = [SpacingToken] | [SpacingToken, SpacingToken]

export interface StackBaseProps {
  gap?: SpacingToken
  padding?: Padding | SpacingShorthand
  width?: AxisSize
  height?: AxisSize
  align?: CrossAlign
  justify?: MainJustify
  background?: ColorToken
  cornerRadius?: RadiusToken
  clip?: boolean
  // a11y — per-node, Lona pattern
  role?: string
  label?: string
}

export interface HStackProps extends StackBaseProps {
  children?: ReactNode
}
export interface VStackProps extends StackBaseProps {
  children?: ReactNode
}
export type ZAlignment =
  | "topStart" | "top" | "topEnd"
  | "start" | "center" | "end"
  | "bottomStart" | "bottom" | "bottomEnd"
export interface ZStackProps {
  alignment?: ZAlignment
  width?: AxisSize
  height?: AxisSize
  background?: ColorToken
  cornerRadius?: RadiusToken
  clip?: boolean
  children?: ReactNode
}
export interface SpacerProps {
  min?: SpacingToken
}
export interface DividerProps {
  axis?: "horizontal" | "vertical"
  inset?: SpacingToken
  color?: ColorToken
}

// ── Content ──────────────────────────────────────────────────────
export interface TextProps {
  children?: ReactNode
  typography?: TypographyToken
  color?: ColorToken
  lines?: number
  align?: "start" | "center" | "end"
  role?: "header" | "text" | "button"
  label?: string
}
export interface ImageProps {
  src: string
  width?: AxisSize
  height?: AxisSize
  resizeMode?: "cover" | "contain" | "fill"
  cornerRadius?: RadiusToken
  label?: string
}
export interface IconProps {
  name: IconName
  size?: number
  color?: ColorToken
}
export interface PressableProps extends StackBaseProps {
  onPress?: () => void
  disabled?: boolean
  children?: ReactNode
}
```

Token branding is enforced at authoring time by a helper (agent note: `token()` reads `generated/palette.ts` and returns branded values; raw strings are a lint error in `.loom.tsx` files).

---

## 3. Token System (`tokens.ts`)

Typography uses SwiftUI's semantic role names, which map 1:1 onto Material 3's scale — the naming is the compatibility layer.

```ts
// tokens.ts — SOURCE OF TRUTH. Seeds only; ramps are HCT-generated.
import { color, spacing, radius } from "./generated/palette"
// generated/palette.ts exports branded tokens + ramps:
//   color.accent.base/.soft/.onAccent, color.surface.base/.raised/.onSurface,
//   color.text.primary/.muted, color.danger.base/.onDanger, plus accent50…accent900

export const tokens = {
  color: {
    surface:     color("surface.base"),
    surfaceRaised: color("surface.raised"),
    textPrimary: color("text.primary"),
    textMuted:   color("text.muted"),
    accent:      color("accent.base"),
    accentSoft:  color("accent.soft"),
    onAccent:    color("accent.onAccent"),
    danger:      color("danger.base"),
    onDanger:    color("danger.onDanger"),
  },
  spacing: {
    1: spacing(4), 2: spacing(8), 3: spacing(12),
    4: spacing(16), 6: spacing(24), 8: spacing(32),
  },
  radius: { sm: radius(6), md: radius(8), lg: radius(16), full: radius(999) },
} as const
```

### Typography roles → all targets

| Loom role | pt / lh | SwiftUI | Compose (Material 3) | shadcn / Tailwind | React Native |
| --- | --- | --- | --- | --- | --- |
| display | 34/41 | `.largeTitle` | `displayMedium` | `text-4xl font-bold` | fontSize 34, lh 41 |
| title | 28/34 | `.title` | `headlineMedium` | `text-2xl font-semibold` | 28/34 |
| title2 | 22/28 | `.title2` | `titleLarge` | `text-xl font-semibold` | 22/28 |
| headline | 17/22 semibold | `.headline` | `titleMedium` | `text-base font-semibold` | 17/22 |
| body | 17/22 | `.body` | `bodyLarge` | `text-base` | 17/22 |
| callout | 15/20 | `.callout` | `bodyMedium` | `text-sm` | 15/20 |
| caption | 13/18 | `.footnote` | `labelMedium` | `text-xs` | 13/18 |
| caption2 | 11/13 | `.caption2` | `labelSmall` | `text-[11px]` | 11/13 |

(Agent note: values live in the token emitter, not in primitives — primitives look up `typography: "body"` and each target resolves it. Adding a role = one token entry + four emitter lines.)

---

## 4. Reference Implementation — Web (`primitives/web/`)

```tsx
// primitives/web/Stack.tsx
import { View, Text } from "react-native-web-internals" // or plain divs; shown as divs
import type { HStackProps, VStackProps, ZStackProps } from "../src/types"

const axisToStyle = {
  hugging: { width: "fit-content" },
  fill: { width: "100%", flexBasis: 0 },
} as const

function stackStyle(p: HStackProps | VStackProps, direction: "row" | "column") {
  return {
    display: "flex",
    flexDirection: direction,
    gap: p.gap,                              // spacing token → px at build
    padding: toPadding(p.padding),
    alignItems: p.align ?? "stretch",
    justifyContent: p.justify ?? "start",
    background: p.background,                 // ColorToken → var(--loom-*)
    borderRadius: p.cornerRadius,
    overflow: p.clip ? "hidden" : undefined,
    ...axisToStyle[p.width] ?? (p.width ? { width: p.width } : null),
    ...axisToStyle[p.height] ?? (p.height ? { height: p.height } : null),
  }
}

export function HStack({ children, ...p }: HStackProps) {
  return (
    <div
      style={stackStyle(p, "row")}
      role={p.role}
      aria-label={p.label}
    >
      {children}
    </div>
  )
}

export function VStack({ children, ...p }: VStackProps) {
  return (
    <div
      style={stackStyle(p, "column")}
      role={p.role}
      aria-label={p.label}
    >
      {children}
    </div>
  )
}

const Z_ALIGN: Record<ZAlignment, CSSProperties> = {
  topStart: { alignItems: "flex-start", justifyContent: "flex-start" },
  center:   { alignItems: "center", justifyContent: "center" },
  bottomEnd: { alignItems: "flex-end", justifyContent: "flex-end" },
  // ... remaining six
}

export function ZStack({ children, alignment = "center", ...p }: ZStackProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        ...Z_ALIGN[alignment],
        width: p.width === "fill" ? "100%" : p.width,
        height: p.height === "fill" ? "100%" : p.height,
        background: p.background,
        borderRadius: p.cornerRadius,
        overflow: p.clip ? "hidden" : undefined,
      }}
    >
      {children}
    </div>
  )
}
```

```tsx
// primitives/web/Content.tsx
export function Spacer({ min }: SpacerProps) {
  return <div style={{ flex: 1, minWidth: min ?? 0, minHeight: min ?? 0 }} />
}

export function Divider({ axis = "horizontal", inset, color }: DividerProps) {
  const isH = axis === "horizontal"
  return (
    <div
      style={{
        flexShrink: 0,
        [isH ? "width" : "height"]: "100%",
        [isH ? "height" : "width"]: 1,
        [isH ? "marginHorizontal" : "marginVertical"]: inset ?? 0,
        background: color ?? "var(--loom-color-separator)",
      }}
    />
  )
}

const TYPOGRAPHY = {
  display: "loom-typography-display",   // emitted CSS classes from token emitter
  title: "loom-typography-title",
  body: "loom-typography-body",
  // ...
} as const

export function Text({ children, typography = "body", color, lines, align, role, label }: TextProps) {
  return (
    <span
      className={TYPOGRAPHY[typography]}
      style={{
        color,
        textAlign: align,
        display: "-webkit-box",
        WebkitLineClamp: lines,
        WebkitBoxOrient: "vertical",
        overflow: lines ? "hidden" : undefined,
      }}
      role={role === "header" ? "heading" : undefined}
      aria-level={role === "header" ? 2 : undefined}
      aria-label={label}
    >
      {children}
    </span>
  )
}

export function Icon({ name, size = 20, color }: IconProps) {
  const Lucide = lucideIcons[name]
  return <Lucide size={size} color={color} strokeWidth={2} />
}

export function Pressable({ onPress, disabled, children, ...p }: PressableProps) {
  return (
    <button
      onClick={onPress}
      disabled={disabled}
      style={{ ...stackStyle(p, "row"), cursor: disabled ? "default" : "pointer" }}
      role={p.role}
      aria-label={p.label}
    >
      {children}
    </button>
  )
}
```

### Native equivalents (`primitives/native/`) — condensed

```tsx
// primitives/native/Stack.tsx — same types, RN implementation
export function HStack({ children, ...p }: HStackProps) {
  return (
    <View
      style={[
        { flexDirection: "row", gap: p.gap, padding: toRNPadding(p.padding),
          alignItems: rnAlign(p.align), justifyContent: rnJustify(p.justify),
          backgroundColor: p.background, borderRadius: p.cornerRadius,
          overflow: p.clip ? "hidden" : undefined,
          width: rnAxis(p.width), height: rnAxis(p.height) },
      ]}
      accessibilityRole={p.role}
      accessibilityLabel={p.label}
    >
      {children}
    </View>
  )
}
// VStack: flexDirection "column". ZStack: plain View, children absolute,
// positioned by alignment via insets. Spacer: View flex 1. Divider:
// View height StyleSheet.hairlineWidth. Pressable: RN Pressable.
```

Key point: **component source (Section 6) imports nothing platform-specific** — `import { HStack, Text, Pressable } from "@loom/primitives"` — and resolution picks web or native per Section 5 of the build plan.

---

## 5. Example Components

### `components/Button/Button.loom.tsx` — the canonical reference

```tsx
import {
  HStack, Text, Icon, Pressable,
  type PressableProps, type SpacingToken, type ColorToken,
  type TypographyToken, type IconName,
} from "@loom/primitives"
import { tokens } from "../../tokens"

export type ButtonSize = "sm" | "md" | "lg"
export type ButtonIntent = "primary" | "secondary" | "ghost" | "destructive"

export interface ButtonProps extends PressableProps {
  /** Visible label. Localize, never hardcode. */
  label: string
  /** Optional leading icon. */
  icon?: IconName
  size?: ButtonSize
  intent?: ButtonIntent
}

export function Button({
  label, icon, size = "md", intent = "primary",
  onPress, disabled, ...rest
}: ButtonProps) {
  return (
    <Pressable
      role="button"
      label={label}
      onPress={onPress}
      disabled={disabled}
      background={bg(intent)}
      cornerRadius={tokens.radius.full}
      padding={padding(size)}
      align="center"
      justify="center"
      width="hugging"
      height="hugging"
      {...rest}
    >
      <HStack gap={2} align="center" justify="center">
        {icon && (
          <Icon name={icon} size={iconSize(size)} color={fg(intent)} />
        )}
        <Text typography={type(size)} color={fg(intent)}>
          {label}
        </Text>
      </HStack>
    </Pressable>
  )
}

// Pure helpers — extraction inlines these into IR as logic.

const padding = (s: ButtonSize): SpacingToken =>
  ({ sm: tokens.spacing[2], md: tokens.spacing[3], lg: tokens.spacing[4] })[s]

const iconSize = (s: ButtonSize) =>
  ({ sm: 14, md: 18, lg: 20 })[s]

const type = (s: ButtonSize): TypographyToken =>
  s === "lg" ? "body" : "callout"

const bg = (i: ButtonIntent): ColorToken =>
  ({
    primary: tokens.color.accent,
    secondary: tokens.color.surfaceRaised,
    ghost: "transparent" as ColorToken,
    destructive: tokens.color.danger,
  })[i]

const fg = (i: ButtonIntent): ColorToken =>
  i === "primary" ? tokens.color.onAccent
  : i === "destructive" ? tokens.color.onDanger
  : tokens.color.textPrimary
```

### `components/Badge/Badge.loom.tsx` — smaller example, ZStack + conditional

```tsx
import { ZStack, Text, type ColorToken, type TypographyToken } from "@loom/primitives"
import { tokens } from "../../tokens"

export interface BadgeProps {
  count: number
  tone?: "accent" | "danger"
}

export function Badge({ count, tone = "danger" }: BadgeProps) {
  return (
    <ZStack
      background={tone === "danger" ? tokens.color.danger : tokens.color.accent}
      cornerRadius={tokens.radius.full}
      align="center"
      width={20} height={20}
    >
      <Text typography="caption2" color={tokens.color.onAccent as ColorToken}>
        {count > 99 ? "99+" : String(count)}
      </Text>
    </ZStack>
  )
}
```

### `compositions/Catalog.loom.tsx` — composition (page-level)

```tsx
import { VStack, HStack, Text, Button, Divider, Image } from "@loom/primitives"
import { tokens } from "../tokens"
import { Badge } from "../components/Badge/Badge.loom"

export interface CatalogProps {
  heading: string
  items: { id: string; title: string; image: string }[]
}

export function Catalog({ heading, items }: CatalogProps) {
  return (
    <VStack gap={6} padding={6} width="fill" background={tokens.color.surface}>
      <HStack width="fill" justify="spaceBetween" align="center">
        <Text typography="title" color={tokens.color.textPrimary}>
          {heading}
        </Text>
        <Badge count={items.length} />
      </HStack>
      <Divider />
      <VStack gap={4} width="fill">
        {items.map((item) => (
          <HStack key={item.id} gap={3} align="center" width="fill">
            <Image src={item.image} width={44} height={44}
                   cornerRadius={tokens.radius.full} resizeMode="cover" />
            <Text typography="body" color={tokens.color.textPrimary}>
              {item.title}
            </Text>
          </HStack>
        ))}
      </VStack>
      <Button label="Load more" intent="secondary" size="sm"
              onPress={() => {}} />
    </VStack>
  )
}
```

---

## 6. Cross-Target Cheat Sheet (what the generators emit)

From `Catalog`'s root `VStack`, per target — the actual generated-shape reference:

| Loom | SwiftUI | Jetpack Compose | shadcn / Tailwind | React Native |
| --- | --- | --- | --- | --- |
| `VStack(gap:6, padding:6, width:"fill")` | `VStack(spacing: 16) { ... }.padding(24).frame(maxWidth: .infinity)` | `Column(verticalArrangement = Arrangement.spacedBy(24.dp), modifier = Modifier.padding(24.dp).fillMaxWidth())` | `<div className="flex flex-col gap-6 p-6 w-full">` | `<View style={{ flexDirection: "column", gap: 24, padding: 24, width: "100%" }}>` |
| `Text(typography:"title", color:…)` | `Text(heading, font: .loomTitle, foregroundColor: LoomTokens.textPrimary)` | `Text(heading, style = LoomTypography.title, color = LoomColors.textPrimary)` | `<span className="loom-typography-title text-text-primary">` | `<Text style={styles.title}>` |
| `HStack(justify:"spaceBetween")` | `HStack { Spacer(); ... }` (expand pattern) | `Row(horizontalArrangement = Arrangement.SpaceBetween)` | `flex justify-between` | `justifyContent: "space-between"` |
| `Image(width:44, cornerRadius:full)` | `Image(...).frame(width: 44).clipShape(Circle())` | `Image(...).size(44.dp).clip(CircleShape)` | `h-11 w-11 rounded-full object-cover` | `borderRadius: 999` |
| `Button(intent:"secondary")` | `Button(action:) { ... }.buttonStyle(.loomSecondary)` | `Surface(onClick = …, shape = CircleShape)` | CVA variant `intent=secondary` | `Pressable` + style fn |
| `Divider` | `Divider()` | `HorizontalDivider()` | `border-t` | hairline View |
| `Badge` (ZStack 20×20) | `ZStack { Text(count) }.frame(w:20,h:20)` | `Box(contentAlignment = Alignment.Center)` | `relative flex size-5 items-center justify-center` | absolute-positioned children |

Note the `HStack(justify: "spaceBetween")` SwiftUI nuance: SwiftUI has no `spaceBetween`, so the generator emits the `Spacer()`-expansion idiom — this is exactly the kind of per-target translation `layout-map.ts` owns, and why the layout subset is kept small.

---

## 7. Agent Implementation Notes

1. **Build order within primitives:** `types.ts` → HStack/VStack → Text → Spacer/Divider → ZStack → Image/Icon → Pressable last (it's a stack + interaction).
2. **`toPadding`/`toRNPadding`/`rnAlign` live in each impl**, never in shared code — token → px resolution is per-target (web needs `var()` for theme, RN needs numbers, Figma needs points).
3. **`"transparent"` is the one whitelisted raw color** (matching Lona's rule for `black`/`white`/`transparent`), encoded as a constant in shared types.
4. **Figma mapping recap for the same primitives:** HStack/VStack → auto-layout frames with `itemSpacing`, ZStack → absolute frame, `fill` → `layoutSizingHorizontal: FILL`, `hugging` → `HUG`, Text → text node + bound typography style, Image → rectangle with image fill, Pressable → component with variant set.
5. **Test fixture:** `Catalog` (three nested stacks, conditional icon, list mapping, mixed content) is the canonical extraction/codegen test case — it exercises every layout feature and both component types (leaf-heavy Button, container-heavy Catalog). Any new target is "done" when it compiles a generated Catalog and the screenshot matches web.
