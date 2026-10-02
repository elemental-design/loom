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

const bg = (t: BadgeTone): ColorName => ({ accent: "accent", danger: "danger" } as const)[t]
const fg = (t: BadgeTone): ColorName => (t === "danger" ? "onDanger" : "onAccent")
