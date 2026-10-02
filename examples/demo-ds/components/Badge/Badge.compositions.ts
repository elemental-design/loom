import type { BadgeProps } from "./Badge.loom"
export const compositions: { name: string; props: BadgeProps }[] = [
  { name: "Default", props: { count: 3 } },
  { name: "Overflow accent", props: { count: 120, tone: "accent" } },
]
