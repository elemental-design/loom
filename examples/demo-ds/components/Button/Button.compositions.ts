import type { ButtonProps } from "./Button.loom"
export const compositions: { name: string; props: ButtonProps }[] = [
  { name: "Primary with icon", props: { label: "Get started", icon: "arrow-right", intent: "primary" } },
  { name: "Secondary", props: { label: "Learn more", intent: "secondary" } },
  { name: "Ghost small", props: { label: "Skip", intent: "ghost", size: "sm" } },
  { name: "Destructive", props: { label: "Delete", intent: "destructive" } },
  { name: "Disabled", props: { label: "Unavailable", disabled: true } },
]
