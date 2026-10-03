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
import type { Axis, Style } from "./host.js"
import type { Theme } from "./theme.js"

export const colorOf = (theme: Theme, name: ColorName): string => {
  if (name === "transparent") return "transparent"
  const v = theme.color[name]
  if (v === undefined) throw new Error(`LOOM300 <native>: unknown color "${name}"`)
  return v
}

export const spaceOf = (theme: Theme, key: SpacingKey): number => {
  const v = theme.space[key]
  if (v === undefined) throw new Error(`LOOM300 <native>: unknown space "${String(key)}"`)
  return v
}

export const radiusOf = (theme: Theme, name: RadiusName): number => {
  const v = theme.radius[name]
  if (v === undefined) throw new Error(`LOOM300 <native>: unknown radius "${name}"`)
  return v
}

export const typographyOf = (theme: Theme, name: string): Theme["typography"][string] => {
  const v = theme.typography[name]
  if (v === undefined) throw new Error(`LOOM300 <native>: unknown typography "${name}"`)
  return v
}

export const paddingStyle = (theme: Theme, p: Padding): Style => {
  if (typeof p === "number") return { padding: spaceOf(theme, p) }
  if (Array.isArray(p)) {
    return { paddingVertical: spaceOf(theme, p[0]), paddingHorizontal: spaceOf(theme, p[1]) }
  }
  return {
    paddingTop: p.top === undefined ? 0 : spaceOf(theme, p.top),
    paddingRight: p.right === undefined ? 0 : spaceOf(theme, p.right),
    paddingBottom: p.bottom === undefined ? 0 : spaceOf(theme, p.bottom),
    paddingLeft: p.left === undefined ? 0 : spaceOf(theme, p.left),
  }
}

export const sizeStyle = (
  prop: AxisSize | undefined,
  dim: "width" | "height",
  parent: Axis,
): Style => {
  if (prop === undefined) return {}
  if (typeof prop === "number") return { [dim]: prop, flexShrink: 0 }
  if (prop === "hugging") {
    // alignSelf applies on the parent's cross axis only; there is no cross
    // axis under a z/none parent.
    const cross = dim === "width" ? parent === "column" : parent === "row"
    return { flexGrow: 0, flexShrink: 0, ...(cross && { alignSelf: "flex-start" }) }
  }
  if (prop === "fill") {
    const main = dim === "width" ? "row" : "column"
    if (parent === main) {
      return { flexGrow: 1, flexShrink: 1, flexBasis: 0, [dim === "width" ? "minWidth" : "minHeight"]: 0 }
    }
    if (parent === "row" || parent === "column") return { alignSelf: "stretch" }
    return { [dim]: "100%" }
  }
  return { [dim]: prop } // `${number}%`
}

const FLEX: Record<CrossAlign | MainJustify, "flex-start" | "center" | "flex-end" | "stretch" | "space-between"> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
  spaceBetween: "space-between",
}

export const alignStyle = (a: CrossAlign): Style => ({ alignItems: FLEX[a] })
export const justifyStyle = (j: MainJustify): Style => ({ justifyContent: FLEX[j] })

// ZStack alignment, by vertical/horizontal component.
const Z_V = { top: "flex-start", center: "center", bottom: "flex-end" } as const
const Z_H = { start: "flex-start", center: "center", end: "flex-end" } as const

export const zAlignParts = (a: ZAlignment): { v: Style; h: Style } => {
  const v = a.startsWith("top") ? "top" : a.startsWith("bottom") ? "bottom" : "center"
  const rest = a.replace(/^(top|bottom)/, "")
  const h = rest === "" ? "center" : rest.toLowerCase()
  return { v: { alignItems: Z_V[v] }, h: { justifyContent: Z_H[h as keyof typeof Z_H] } }
}

export const boxStyle = (
  theme: Theme,
  p: Pick<StackProps, "background" | "cornerRadius" | "clip">,
): Style => ({
  ...(p.background !== undefined && { backgroundColor: colorOf(theme, p.background) }),
  ...(p.cornerRadius !== undefined && { borderRadius: radiusOf(theme, p.cornerRadius) }),
  ...(p.clip && { overflow: "hidden" }),
})

export const stackStyle = (
  theme: Theme,
  p: StackProps,
  direction: "row" | "column",
  parent: Axis,
): Style => ({
  flexDirection: direction,
  ...(p.gap !== undefined && { gap: spaceOf(theme, p.gap) }),
  ...(p.padding !== undefined && paddingStyle(theme, p.padding)),
  ...alignStyle(p.align ?? "stretch"),
  ...justifyStyle(p.justify ?? "start"),
  ...boxStyle(theme, p),
  ...sizeStyle(p.width, "width", parent),
  ...sizeStyle(p.height, "height", parent),
})
