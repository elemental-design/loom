import type { ComponentType, ReactNode } from "react"

// RN-style style object: camelCase keys, unitless numbers.
export type Style = Record<string, number | string | undefined>
export type StyleOrFn = Style | ((state: { pressed: boolean }) => Style)

export type Axis = "row" | "column" | "z" | "none"

// The slice of the RN API the primitives need. react-sketchapp and
// react-figmaapp export View/Text/Image with this API but no Pressable.
export interface Host {
  View: ComponentType<{
    style?: Style
    children?: ReactNode
    accessibilityRole?: string
    accessibilityLabel?: string
    [key: string]: unknown
  }>
  Text: ComponentType<{
    style?: Style
    children?: ReactNode
    numberOfLines?: number
    accessibilityRole?: string
    accessibilityLabel?: string
    [key: string]: unknown
  }>
  Image: ComponentType<{
    source?: { uri?: string }
    style?: Style
    resizeMode?: string
    accessibilityLabel?: string
    [key: string]: unknown
  }>
  Pressable?: ComponentType<{
    style?: StyleOrFn
    onPress?: () => void
    disabled?: boolean
    children?: ReactNode
    accessibilityRole?: string
    accessibilityLabel?: string
    [key: string]: unknown
  }>
}
