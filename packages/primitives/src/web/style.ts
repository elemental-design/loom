import type { CSSProperties } from "react"
import type {
  AxisSize,
  ColorName,
  CrossAlign,
  MainJustify,
  Padding,
  RadiusName,
  SpacingKey,
  StackProps,
  ZAlignment,
} from "../types.js"
import type { Axis } from "./axis-context.js"

export const kebab = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()

export const spacingVar = (k: SpacingKey): string => `var(--loom-space-${k})`
export const colorVar = (name: ColorName): string =>
  name === "transparent" ? "transparent" : `var(--loom-color-${kebab(name)})`
export const radiusVar = (name: RadiusName): string => `var(--loom-radius-${kebab(name)})`

export const paddingStyle = (p: Padding): CSSProperties => {
  if (typeof p === "number") return { padding: spacingVar(p) }
  if (Array.isArray(p)) return { padding: `${spacingVar(p[0])} ${spacingVar(p[1])}` }
  const side = (k: SpacingKey | undefined): string => (k === undefined ? "0" : spacingVar(k))
  return { padding: `${side(p.top)} ${side(p.right)} ${side(p.bottom)} ${side(p.left)}` }
}

export const sizeStyle = (
  prop: AxisSize | undefined,
  dim: "width" | "height",
  parent: Axis,
): CSSProperties => {
  if (prop === undefined) return {}
  if (typeof prop === "number") return { [dim]: `${prop}px`, flexShrink: 0 }
  if (prop === "hugging") return { [dim]: "fit-content", flex: "0 0 auto" }
  if (prop === "fill") {
    const main = dim === "width" ? "row" : "column"
    if (parent === main) return { flex: "1 1 0", [dim === "width" ? "minWidth" : "minHeight"]: 0 }
    if (parent === "row" || parent === "column") return { alignSelf: "stretch" }
    return { [dim]: "100%" }
  }
  return { [dim]: prop }
}

const FLEX: Record<CrossAlign | MainJustify, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  spaceBetween: "space-between",
}

export const alignStyle = (a: CrossAlign): CSSProperties => ({ alignItems: FLEX[a] })
export const justifyStyle = (j: MainJustify): CSSProperties => ({ justifyContent: FLEX[j] })

const Z_V = { top: "start", bottom: "end", center: "center" } as const
const Z_H = { start: "start", end: "end", center: "center" } as const

export const zAlignStyle = (a: ZAlignment): CSSProperties => {
  const v = a.startsWith("top") ? "top" : a.startsWith("bottom") ? "bottom" : "center"
  const rest = a.replace(/^(top|bottom)/, "")
  const h = rest === "" ? "center" : rest.toLowerCase()
  return { alignItems: Z_V[v], justifyItems: Z_H[h as keyof typeof Z_H] }
}

export const boxStyle = (
  p: Pick<StackProps, "background" | "cornerRadius" | "clip">,
): CSSProperties => ({
  ...(p.background !== undefined && { background: colorVar(p.background) }),
  ...(p.cornerRadius !== undefined && { borderRadius: radiusVar(p.cornerRadius) }),
  ...(p.clip && { overflow: "hidden" }),
})

export const stackStyle = (
  p: StackProps,
  direction: "row" | "column",
  parent: Axis,
): CSSProperties => ({
  display: "flex",
  flexDirection: direction,
  boxSizing: "border-box",
  minWidth: 0,
  ...(p.gap !== undefined && { gap: spacingVar(p.gap) }),
  ...(p.padding !== undefined && paddingStyle(p.padding)),
  ...alignStyle(p.align ?? "stretch"),
  ...justifyStyle(p.justify ?? "start"),
  ...boxStyle(p),
  ...sizeStyle(p.width, "width", parent),
  ...sizeStyle(p.height, "height", parent),
})
