// Ambient module stubs for the optional native host packages. Only the
// members `Host` (host.ts) uses are declared; the real packages are not
// installed and must not be added to dependencies.

declare module "react-native" {
  import type { ComponentType, ReactNode } from "react"

  export type Style = Record<string, number | string | undefined>

  export const View: ComponentType<{
    style?: Style
    children?: ReactNode
    [key: string]: unknown
  }>
  export const Text: ComponentType<{
    style?: Style
    children?: ReactNode
    numberOfLines?: number
    accessibilityRole?: string
    accessibilityLabel?: string
    [key: string]: unknown
  }>
  export const Image: ComponentType<{
    source?: { uri?: string }
    style?: Style
    resizeMode?: string
    accessibilityLabel?: string
    [key: string]: unknown
  }>
  export const Pressable: ComponentType<{
    style?: Style | ((state: { pressed: boolean }) => Style)
    onPress?: () => void
    disabled?: boolean
    children?: ReactNode
    accessibilityRole?: string
    accessibilityLabel?: string
    [key: string]: unknown
  }>
  export const StyleSheet: { hairlineWidth: number }
}

declare module "react-sketchapp" {
  import type { ComponentType, ReactNode } from "react"

  export type Style = Record<string, number | string | undefined>

  export const View: ComponentType<{ style?: Style; children?: ReactNode; [key: string]: unknown }>
  export const Text: ComponentType<{ style?: Style; children?: ReactNode; [key: string]: unknown }>
  export const Image: ComponentType<{
    source?: { uri?: string }
    style?: Style
    resizeMode?: string
    [key: string]: unknown
  }>
  export const StyleSheet: { create: (s: object) => object }
  export function render(
    element: ReactNode,
    options?: { name?: string },
  ): void
}

declare module "react-figmaapp" {
  import type { ComponentType, ReactNode } from "react"

  export type Style = Record<string, number | string | undefined>

  export const View: ComponentType<{ style?: Style; children?: ReactNode; [key: string]: unknown }>
  export const Text: ComponentType<{ style?: Style; children?: ReactNode; [key: string]: unknown }>
  export const Image: ComponentType<{
    source?: { uri?: string }
    style?: Style
    resizeMode?: string
    [key: string]: unknown
  }>
  export const StyleSheet: { create: (s: object) => object }
  export function render(
    element: ReactNode,
    options?: { name?: string },
  ): void
}
