import { domainOf, evalExpr, paramsOfExpr, type Value } from "../ir/eval.js"
import type { IRExpr, IRNode, IRParam, PrimitiveName } from "../ir/types.js"
import { PROP_KINDS, isStyleKind } from "../lint/style-props.js"
import {
  GenError,
  alignClass,
  colorClass,
  gapClass,
  iconSizeClass,
  justifyClass,
  linesClass,
  paddingClasses,
  radiusClass,
  resizeModeClass,
  sizeClass,
  spacingClass,
  textAlignClass,
  typographyClasses,
  zAlignClasses,
  type Axis,
  type GenTokens,
} from "./maps.js"

export type PrimitiveNode = Extract<IRNode, { kind: "primitive" }>

export interface NodeClasses {
  base: string[]
  variants: Record<string, Record<string, string[]>>
}

const lit = (v: string | number): IRExpr => ({ lit: v })

const DEFAULTS: Partial<Record<PrimitiveName, Record<string, IRExpr>>> = {
  ZStack: { alignment: lit("center") },
  Divider: { axis: lit("horizontal"), color: lit("separator") },
  Text: { typography: lit("body"), color: lit("textPrimary") },
  Image: { resizeMode: lit("cover") },
  Icon: { size: lit(20), color: lit("textPrimary") },
  Pressable: { direction: lit("horizontal") },
}

const PRESSABLE_BASE = [
  "flex",
  "cursor-pointer",
  "hover:opacity-90",
  "active:opacity-80",
  "disabled:opacity-50",
  "disabled:cursor-default",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-ring",
]

const ELEMENT_BASE: Record<PrimitiveName, string[]> = {
  HStack: ["flex", "flex-row"],
  VStack: ["flex", "flex-col"],
  ZStack: ["relative", "grid", "*:col-start-1", "*:row-start-1"],
  Spacer: ["flex-1"],
  Divider: ["self-stretch", "shrink-0"],
  Text: [],
  Image: [],
  Icon: [],
  Pressable: PRESSABLE_BASE,
}

const evalStatic = (e: IRExpr): Value => evalExpr(e, { params: {}, vars: {} })

const effectiveProps = (node: PrimitiveNode): Record<string, IRExpr> => ({
  ...DEFAULTS[node.type],
  ...node.props,
})

export function staticProp(node: PrimitiveNode, name: string): Value | undefined {
  const e = effectiveProps(node)[name]
  if (!e) return undefined
  if (paramsOfExpr(e).size > 0) throw new GenError(`${node.type}.${name} must be static (node ${node.id})`)
  return evalStatic(e)
}

export function ownAxis(node: PrimitiveNode): Axis {
  if (node.type === "HStack") return "row"
  if (node.type === "VStack") return "column"
  if (node.type === "ZStack") return "z"
  if (node.type === "Pressable") return staticProp(node, "direction") === "vertical" ? "column" : "row"
  return "none"
}

const need = <T>(v: Value, type: "number" | "string", what: string): T => {
  if (typeof v !== type) throw new GenError(`${what} must resolve to a ${type}, got ${JSON.stringify(v)}`)
  return v as T
}

function propClasses(node: PrimitiveNode, prop: string, v: Value, parent: Axis, t: GenTokens): string[] {
  const what = `${node.type}.${prop}`
  switch (prop) {
    case "gap": return [gapClass(need<number>(v, "number", what), t)]
    case "padding": return paddingClasses(v, t)
    case "width":
    case "height": return sizeClass(v, prop, parent)
    case "align": return [node.type === "Text" ? textAlignClass(v) : alignClass(v)]
    case "justify": return [justifyClass(v)]
    case "background": return [colorClass("bg", v)]
    case "color": return [colorClass(node.type === "Divider" ? "bg" : "text", v)]
    case "cornerRadius": return [radiusClass(v, t)]
    case "clip": return v ? ["overflow-hidden"] : []
    case "alignment": return zAlignClasses(v)
    case "min": return [spacingClass("min-w", v, t), spacingClass("min-h", v, t)]
    case "axis": return v === "vertical" ? ["w-px"] : v === "horizontal" ? ["h-px"] : fail(what, v)
    case "inset": return [spacingClass(staticProp(node, "axis") === "vertical" ? "my" : "mx", v, t)]
    case "typography": return typographyClasses(v)
    case "lines": return [linesClass(v)]
    case "resizeMode": return [resizeModeClass(v)]
    case "size": return [iconSizeClass(v)]
    case "direction": return v === "vertical" ? ["flex-col"] : []
  }
  throw new GenError(`unsupported prop ${what}`)
}

const fail = (what: string, v: Value): never => {
  throw new GenError(`no class mapping for ${what} ${JSON.stringify(v)}`)
}

const uniqSorted = (xs: string[]): string[] => [...new Set(xs)].sort()

export function nodeClasses(node: PrimitiveNode, parent: Axis, params: IRParam[], t: GenTokens): NodeClasses {
  const kinds = PROP_KINDS[node.type]
  const base = [...ELEMENT_BASE[node.type]]
  const variants: Record<string, Record<string, string[]>> = {}
  for (const [name, expr] of Object.entries(effectiveProps(node))) {
    if (!Object.hasOwn(kinds, name)) throw new GenError(`unsupported prop ${node.type}.${name} (node ${node.id})`)
    if (!isStyleKind(kinds[name])) continue
    const used = [...paramsOfExpr(expr)]
    if (used.length === 0) {
      base.push(...propClasses(node, name, evalStatic(expr), parent, t))
      continue
    }
    const def = used.length === 1 ? params.find((p) => p.name === used[0]) : undefined
    const domain = def && domainOf(def)
    if (!def || !domain) {
      throw new GenError(`${node.type}.${name} (node ${node.id}) must depend on exactly one enum/boolean param`)
    }
    const group = (variants[def.name] ??= {})
    for (const v of domain) {
      const classes = propClasses(node, name, evalExpr(expr, { params: { [def.name]: v }, vars: {} }), parent, t)
      ;(group[String(v)] ??= []).push(...classes)
    }
  }
  return {
    base: uniqSorted(base),
    variants: Object.fromEntries(
      Object.entries(variants).map(([p, vs]) => [p, Object.fromEntries(Object.entries(vs).map(([v, c]) => [v, uniqSorted(c)]))]),
    ),
  }
}
