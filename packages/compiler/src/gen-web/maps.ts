export class GenError extends Error {
  constructor(
    message: string,
    readonly code: string = "LOOM301",
  ) {
    super(message)
  }
}

export type Axis = "row" | "column" | "z" | "none"

export interface GenTokens {
  spacing: Readonly<Record<string, number>>
  radius: ReadonlySet<string>
}

export const kebab = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()

const fail = (message: string): never => {
  throw new GenError(message)
}

export const spacingClass = (prefix: string, key: unknown, t: GenTokens): string => {
  const px = Object.hasOwn(t.spacing, String(key)) ? t.spacing[String(key)] : undefined
  if (px === undefined) return fail(`unknown spacing key ${JSON.stringify(key)}`)
  return px === Number(key) * 4 ? `${prefix}-${key}` : `${prefix}-[${px}px]`
}

export const gapClass = (k: unknown, t: GenTokens): string => spacingClass("gap", k, t)

export const paddingClasses = (p: unknown, t: GenTokens): string[] => {
  if (typeof p === "number") return [spacingClass("p", p, t)]
  if (Array.isArray(p) && p.length === 2) return [spacingClass("py", p[0], t), spacingClass("px", p[1], t)]
  if (p && typeof p === "object" && !Array.isArray(p)) {
    const o = p as Record<string, unknown>
    const sides = { top: "pt", right: "pr", bottom: "pb", left: "pl" } as const
    return Object.entries(sides).flatMap(([side, prefix]) =>
      o[side] === undefined ? [] : [spacingClass(prefix, o[side], t)],
    )
  }
  return fail(`unsupported padding value ${JSON.stringify(p)}`)
}

const dimClass = (prefix: string, n: number): string =>
  n % 4 === 0 ? `${prefix}-${n / 4}` : `${prefix}-[${n}px]`

export const sizeClass = (prop: unknown, dim: "width" | "height", parent: Axis): string[] => {
  const p = dim === "width" ? "w" : "h"
  const v = prop
  if (typeof v === "number") return [dimClass(p, v)]
  if (typeof v === "string" && /^\d+(\.\d+)?%$/.test(v)) return [`${p}-[${v}]`]
  if (v === "hugging") return [`${p}-fit`]
  if (v === "fill") {
    const main = dim === "width" ? "row" : "column"
    if (parent === main) return ["flex-1", dim === "width" ? "min-w-0" : "min-h-0"]
    if (parent === "row" || parent === "column") return ["self-stretch"]
    return [`${p}-full`]
  }
  return fail(`unsupported ${dim} value ${JSON.stringify(prop)}`)
}

const lookup = (table: Record<string, string>, what: string, v: unknown): string => {
  const key = String(v)
  return Object.hasOwn(table, key) ? (table[key] as string) : fail(`no class mapping for ${what} ${JSON.stringify(v)}`)
}

export const alignClass = (a: unknown): string =>
  lookup({ start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" }, "align", a)

export const justifyClass = (j: unknown): string =>
  lookup(
    { start: "justify-start", center: "justify-center", end: "justify-end", spaceBetween: "justify-between" },
    "justify",
    j,
  )

export const textAlignClass = (a: unknown): string =>
  lookup({ start: "text-left", center: "text-center", end: "text-right" }, "text align", a)

export const resizeModeClass = (m: unknown): string =>
  lookup({ cover: "object-cover", contain: "object-contain", fill: "object-fill" }, "resizeMode", m)

export const COLORS: Record<string, string> = {
  surface: "background",
  surfaceRaised: "secondary",
  textPrimary: "foreground",
  textMuted: "muted-foreground",
  separator: "border",
  accent: "primary",
  accentSoft: "accent",
  onAccent: "primary-foreground",
  danger: "destructive",
  onDanger: "destructive-foreground",
  transparent: "transparent",
}

export const colorClass = (prefix: "bg" | "text", name: unknown): string => {
  if (typeof name !== "string") return fail(`unsupported color value ${JSON.stringify(name)}`)
  return `${prefix}-${Object.hasOwn(COLORS, name) ? COLORS[name] : `loom-${kebab(name)}`}`
}

export const radiusClass = (name: unknown, t: GenTokens): string => {
  if (typeof name !== "string" || !t.radius.has(name)) return fail(`unknown radius ${JSON.stringify(name)}`)
  return `rounded-${kebab(name)}`
}

export const TYPOGRAPHY: Record<string, string[]> = {
  display: ["text-4xl", "font-bold"],
  title: ["text-2xl", "font-semibold"],
  title2: ["text-xl", "font-semibold"],
  headline: ["text-base", "font-semibold"],
  body: ["text-base"],
  callout: ["text-sm"],
  caption: ["text-xs"],
  caption2: ["text-[11px]", "leading-[13px]"],
}

export const typographyClasses = (name: unknown): string[] =>
  typeof name === "string" && Object.hasOwn(TYPOGRAPHY, name)
    ? (TYPOGRAPHY[name] as string[])
    : fail(`no class mapping for typography ${JSON.stringify(name)}`)

const Z: Record<string, [v: string, h: string]> = {
  topStart: ["start", "start"],
  top: ["start", "center"],
  topEnd: ["start", "end"],
  start: ["center", "start"],
  center: ["center", "center"],
  end: ["center", "end"],
  bottomStart: ["end", "start"],
  bottom: ["end", "center"],
  bottomEnd: ["end", "end"],
}

export const zAlignClasses = (a: unknown): string[] => {
  const pair = typeof a === "string" && Object.hasOwn(Z, a) ? (Z[a] as [string, string]) : undefined
  if (!pair) return fail(`no class mapping for alignment ${JSON.stringify(a)}`)
  return pair[0] === pair[1] ? [`place-items-${pair[0]}`] : [`items-${pair[0]}`, `justify-items-${pair[1]}`]
}

export const iconSizeClass = (n: unknown): string =>
  typeof n === "number" ? dimClass("size", n) : fail(`unsupported icon size ${JSON.stringify(n)}`)

export const linesClass = (n: unknown): string =>
  typeof n === "number" ? `line-clamp-${n}` : fail(`unsupported lines value ${JSON.stringify(n)}`)
