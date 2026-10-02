import { useContext } from "react"
import { icons } from "lucide-react"
import type { DividerProps, IconProps, ImageProps, SpacerProps, TextProps } from "../types.js"
import { AxisContext } from "./axis-context.js"
import { roleAttrs } from "./role.js"
import { colorVar, radiusVar, sizeStyle, spacingVar } from "./style.js"

export const Spacer = ({ min }: SpacerProps) => {
  const m = min === undefined ? 0 : spacingVar(min)
  return <div style={{ flex: "1 1 0", minWidth: m, minHeight: m }} />
}

export const Divider = ({ axis = "horizontal", inset, color }: DividerProps) => {
  const i = inset === undefined ? undefined : spacingVar(inset)
  return (
    <div
      role="separator"
      style={{
        background: colorVar(color ?? "separator"),
        alignSelf: "stretch",
        flexShrink: 0,
        ...(axis === "horizontal"
          ? { height: "1px", ...(i && { marginInline: i }) }
          : { width: "1px", ...(i && { marginBlock: i }) }),
      }}
    />
  )
}

export const Text = ({
  children,
  typography = "body",
  color = "textPrimary",
  lines,
  align,
  role,
  label,
}: TextProps) => (
  <span
    className={`loom-typography-${typography}`}
    style={{
      color: colorVar(color),
      ...(lines !== undefined && {
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: lines,
        overflow: "hidden",
      }),
      ...(align !== undefined && { textAlign: align }),
    }}
    aria-label={label}
    {...roleAttrs(role)}
  >
    {children}
  </span>
)

const FIT = { cover: "cover", contain: "contain", fill: "fill" } as const

export const Image = ({ src, width, height, resizeMode = "cover", cornerRadius, label }: ImageProps) => {
  const parent = useContext(AxisContext)
  return (
    <img
      src={src}
      alt={label ?? ""}
      style={{
        objectFit: FIT[resizeMode],
        ...(cornerRadius !== undefined && { borderRadius: radiusVar(cornerRadius), overflow: "hidden" }),
        ...sizeStyle(width, "width", parent),
        ...sizeStyle(height, "height", parent),
      }}
    />
  )
}

const warned = new Set<string>()

const pascal = (s: string): string =>
  s.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("")

export const Icon = ({ name, size = 20, color = "textPrimary" }: IconProps) => {
  const Cmp = (icons as Record<string, typeof icons.Activity | undefined>)[pascal(name)]
  if (!Cmp) {
    if (!warned.has(name)) {
      warned.add(name)
      console.warn(`[loom] unknown icon "${name}"`)
    }
    return null
  }
  return (
    <Cmp
      size={size}
      color="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      style={{ color: colorVar(color), flexShrink: 0 }}
    />
  )
}
