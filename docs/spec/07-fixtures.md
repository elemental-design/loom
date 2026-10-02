# 07 — Fixtures (copy verbatim into `examples/demo-ds/components/`)

These are the canonical test inputs. They obey all rules in 03. Do not "improve" them; tests depend on their shape.

## Button — `components/Button/Button.loom.tsx`

```tsx
import { Pressable, Icon, Text } from "@loom/primitives"
import type { ColorName, IconName, SpacingKey, TypographyName } from "@loom/primitives"

export type ButtonSize = "sm" | "md" | "lg"
export type ButtonIntent = "primary" | "secondary" | "ghost" | "destructive"

export interface ButtonProps {
  /** Visible label. Localize, never hardcode. */
  label: string
  /** Optional leading icon (lucide name). */
  icon?: IconName
  size?: ButtonSize
  intent?: ButtonIntent
  disabled?: boolean
  onPress?: () => void
}

export const loom = { id: "cmp_button", version: "1.0.0" } as const

export function Button({ label, icon, size = "md", intent = "primary", disabled, onPress }: ButtonProps) {
  return (
    <Pressable
      label={label}
      onPress={onPress}
      disabled={disabled}
      background={bg(intent)}
      cornerRadius="full"
      padding={padding(size)}
      gap={2}
      align="center"
      justify="center"
      width="hugging"
      height="hugging"
    >
      {icon && <Icon name={icon} size={iconSize(size)} color={fg(intent)} />}
      <Text typography={typo(size)} color={fg(intent)}>
        {label}
      </Text>
    </Pressable>
  )
}

const padding = (s: ButtonSize): SpacingKey => ({ sm: 2, md: 3, lg: 4 })[s]
const iconSize = (s: ButtonSize) => ({ sm: 14, md: 18, lg: 20 })[s]
const typo = (s: ButtonSize): TypographyName => (s === "lg" ? "body" : "callout")
const bg = (i: ButtonIntent): ColorName =>
  ({ primary: "accent", secondary: "surfaceRaised", ghost: "transparent", destructive: "danger" })[i]
const fg = (i: ButtonIntent): ColorName =>
  i === "primary" ? "onAccent" : i === "destructive" ? "onDanger" : "textPrimary"
```

## Badge — `components/Badge/Badge.loom.tsx`

```tsx
import { ZStack, Text } from "@loom/primitives"
import type { ColorName } from "@loom/primitives"

export type BadgeTone = "accent" | "danger"

export interface BadgeProps {
  count: number
  tone?: BadgeTone
}

export const loom = { id: "cmp_badge", version: "1.0.0" } as const

export function Badge({ count, tone = "danger" }: BadgeProps) {
  return (
    <ZStack width={20} height={20} cornerRadius="full" background={bg(tone)}>
      <Text typography="caption2" color={fg(tone)}>
        {count > 99 ? "99+" : String(count)}
      </Text>
    </ZStack>
  )
}

const bg = (t: BadgeTone): ColorName => ({ accent: "accent", danger: "danger" })[t]
const fg = (t: BadgeTone): ColorName => (t === "danger" ? "onDanger" : "onAccent")
```

## Catalog — `components/Catalog/Catalog.loom.tsx`

Exercises nesting, `repeat`, component refs, `fill`, `spaceBetween`.

```tsx
import { VStack, HStack, Text, Divider, Image } from "@loom/primitives"
import { Badge } from "../Badge/Badge.loom"
import { Button } from "../Button/Button.loom"

export interface CatalogProps {
  heading: string
  items: { id: string; title: string; image: string }[]
  onLoadMore: () => void
}

export const loom = { id: "cmp_catalog", version: "1.0.0" } as const

export function Catalog({ heading, items, onLoadMore }: CatalogProps) {
  return (
    <VStack gap={6} padding={6} width="fill" background="surface">
      <HStack width="fill" justify="spaceBetween" align="center">
        <Text typography="title" color="textPrimary">
          {heading}
        </Text>
        <Badge count={42} />
      </HStack>
      <Divider />
      <VStack gap={4} width="fill">
        {items.map((item) => (
          <HStack key={item.id} gap={3} align="center" width="fill">
            <Image src={item.image} width={44} height={44} cornerRadius="full" resizeMode="cover" />
            <Text typography="body" color="textPrimary">
              {item.title}
            </Text>
          </HStack>
        ))}
      </VStack>
      <Button label="Load more" intent="secondary" size="sm" onPress={onLoadMore} />
    </VStack>
  )
}
```

(`Badge count={42}` is a literal because `items.length` is outside the expression subset.)

## Compositions — `components/<Name>/<Name>.compositions.ts` (used by demo app only in MVP)

```ts
import type { ButtonProps } from "./Button.loom"
export const compositions: { name: string; props: ButtonProps }[] = [
  { name: "Primary with icon", props: { label: "Get started", icon: "arrow-right", intent: "primary" } },
  { name: "Secondary", props: { label: "Learn more", intent: "secondary" } },
  { name: "Ghost small", props: { label: "Skip", intent: "ghost", size: "sm" } },
  { name: "Destructive", props: { label: "Delete", intent: "destructive" } },
  { name: "Disabled", props: { label: "Unavailable", disabled: true } },
]
```

Write the analogous file for Badge (`{count:3}`, `{count:120, tone:"accent"}`) and Catalog (3 items, picsum-free: use `"/placeholder.png"`).
