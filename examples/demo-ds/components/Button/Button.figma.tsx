import { Pressable, Icon, Text } from "@loom/primitives/figma"
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
      // width="hugging"
      // height="hugging"
    >
      {icon && <Icon name={icon} size={iconSize(size)} color={fg(intent)} />}
      <Text typography={typo(size)} color={fg(intent)}>
        {label}
      </Text>
    </Pressable>
  )
}

const padding = (s: ButtonSize): SpacingKey => ({ sm: 2, md: 3, lg: 4 } as const)[s]
const iconSize = (s: ButtonSize) => ({ sm: 14, md: 18, lg: 20 })[s]
const typo = (s: ButtonSize): TypographyName => (s === "lg" ? "body" : "callout")
const bg = (i: ButtonIntent): ColorName =>
  ({ primary: "accent", secondary: "surfaceRaised", ghost: "transparent", destructive: "danger" } as const)[i]
const fg = (i: ButtonIntent): ColorName =>
  i === "primary" ? "onAccent" : i === "destructive" ? "onDanger" : "textPrimary"
