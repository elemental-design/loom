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
