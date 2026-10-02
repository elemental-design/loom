import { evalExpr, paramsOfExpr } from "../ir/eval.js"
import type { IRExpr, IRNode, IRParam } from "../ir/types.js"
import { PROP_KINDS } from "../lint/style-props.js"
import { emitExpr, emitKey } from "./emit-expr.js"
import { nodeClasses, ownAxis, type NodeClasses, type PrimitiveNode } from "./classes.js"
import { GenError, kebab, type Axis, type GenTokens } from "./maps.js"

export interface Ctx {
  name: string
  params: IRParam[]
  tokens: GenTokens
  cvas: string[]
  usesCn: boolean
  usesIcon: boolean
  components: Map<string, string>
}

export const ind = (lines: string[], n = 1): string[] => lines.map((l) => "  ".repeat(n) + l)

const SAFE_ATTR = /^[^"\\\n\r{}<>&]*$/
const SAFE_TEXT = /^(?! )(?!.* $)[^{}<>&\n\r\\]*$/

const attr = (name: string, e: IRExpr): string => {
  if ("lit" in e) {
    if (e.lit === true) return name
    if (typeof e.lit === "string" && SAFE_ATTR.test(e.lit)) return `${name}="${e.lit}"`
  }
  return `${name}={${emitExpr(e)}}`
}

const ROLE_ATTRS: Record<string, string[]> = {
  button: ['role="button"'],
  header: ['role="heading"', "aria-level={2}"],
  image: ['role="img"'],
  list: ['role="list"'],
  listitem: ['role="listitem"'],
  text: [],
  none: ['role="presentation"'],
}

function roleAttrs(node: PrimitiveNode): string[] {
  const e = node.props["role"]
  if (!e) return []
  if (paramsOfExpr(e).size > 0) throw new GenError(`${node.type}.role must be static (node ${node.id})`)
  const v = String(evalExpr(e, { params: {}, vars: {} }))
  const out = Object.hasOwn(ROLE_ATTRS, v) ? ROLE_ATTRS[v] : undefined
  if (!out) throw new GenError(`no mapping for role "${v}" (node ${node.id})`)
  return out
}

function cvaCall(ctx: Ctx, name: string, nc: NodeClasses): string {
  const groups = Object.keys(nc.variants).sort()
  const line = (g: string): string => {
    const vs = nc.variants[g] as Record<string, string[]>
    const entries = Object.keys(vs)
      .sort()
      .map((v) => `${emitKey(v)}: ${JSON.stringify((vs[v] as string[]).join(" "))}`)
    return `${emitKey(g)}: { ${entries.join(", ")} }`
  }
  const defaults = groups.flatMap((g) => {
    const p = ctx.params.find((x) => x.name === g)
    if (p?.default !== undefined) return [`${emitKey(g)}: ${JSON.stringify(p.default)}`]
    return p?.type === "boolean" ? [`${emitKey(g)}: false`] : []
  })
  const variants =
    groups.length === 1
      ? [`  variants: { ${line(groups[0] as string)} },`]
      : ["  variants: {", ...ind(groups.map((g) => `${line(g)},`), 2), "  },"]
  const decl = [
    `const ${name} = cva(${JSON.stringify(nc.base.join(" "))}, {`,
    ...variants,
    ...(defaults.length ? [`  defaultVariants: { ${defaults.join(", ")} },`] : []),
    "})",
  ]
  ctx.cvas.push(decl.join("\n"))
  return `${name}({ ${groups.join(", ")} })`
}

function classAttr(node: PrimitiveNode, parent: Axis, ctx: Ctx, isRoot: boolean): string | undefined {
  const nc = nodeClasses(node, parent, ctx.params, ctx.tokens)
  const hasVariants = Object.keys(nc.variants).length > 0
  let expr: string
  if (hasVariants) {
    const suffix = isRoot ? "" : `N${node.id.slice(1).replaceAll(".", "_")}`
    expr = cvaCall(ctx, `${ctx.name}${suffix}Variants`, nc)
  } else if (nc.base.length > 0) {
    expr = JSON.stringify(nc.base.join(" "))
  } else {
    expr = ""
  }
  if (isRoot) {
    ctx.usesCn = true
    return `className={${expr ? `cn(${expr}, className)` : "className"}}`
  }
  if (!expr) return undefined
  return hasVariants ? `className={${expr}}` : `className=${expr}`
}

function textChild(e: IRExpr): string {
  if ("lit" in e && typeof e.lit === "string" && SAFE_TEXT.test(e.lit) && e.lit !== "") return e.lit
  return `{${emitExpr(e)}}`
}

function elementLines(node: PrimitiveNode, parent: Axis, ctx: Ctx, isRoot: boolean, key?: IRExpr): string[] {
  const kinds = PROP_KINDS[node.type]
  const p = node.props
  const cls = classAttr(node, parent, ctx, isRoot)
  const fixed: string[] = []
  const rest: [string, string][] = []
  let tag = "div"
  let inline: IRExpr | undefined
  const content = (prop: string, name: string): void => {
    const e = p[prop]
    if (e) rest.push([name, attr(name, e)])
  }

  switch (node.type) {
    case "HStack":
    case "VStack":
    case "ZStack":
      fixed.push(...roleAttrs(node))
      content("label", "aria-label")
      break
    case "Spacer":
      break
    case "Divider":
      fixed.push('role="separator"')
      break
    case "Text":
      tag = "span"
      fixed.push(...roleAttrs(node))
      content("label", "aria-label")
      inline = p["content"]
      break
    case "Image": {
      tag = "img"
      const label = p["label"]
      const alt =
        !label ? 'alt=""'
        : "lit" in label && typeof label.lit === "string" && SAFE_ATTR.test(label.lit) ? `alt="${label.lit}"`
        : `alt={${emitExpr(label, 19)} ?? ""}`
      rest.push(["alt", alt])
      content("src", "src")
      break
    }
    case "Icon":
      tag = "LoomIcon"
      ctx.usesIcon = true
      content("name", "name")
      break
    case "Pressable":
      tag = "button"
      fixed.push('type="button"')
      content("label", "aria-label")
      content("onPress", "onClick")
      content("disabled", "disabled")
      break
  }
  for (const name of Object.keys(p)) {
    if (!Object.hasOwn(kinds, name)) throw new GenError(`unsupported prop ${node.type}.${name} (node ${node.id})`)
  }

  const attrs = [
    ...(key ? [attr("key", key)] : []),
    ...fixed,
    ...(cls ? [cls] : []),
    ...rest.sort((a, b) => (a[0] < b[0] ? -1 : 1)).map((r) => r[1]),
  ]
  const open = `<${tag}${attrs.map((a) => ` ${a}`).join("")}`
  if (inline) return [`${open}>${textChild(inline)}</${tag}>`]
  if (node.children.length === 0) return [`${open} />`]
  const axis = ownAxis(node)
  return [`${open}>`, ...ind(node.children.flatMap((c) => emitChild(c, axis, ctx))), `</${tag}>`]
}

function componentLines(node: Extract<IRNode, { kind: "component" }>, ctx: Ctx, key?: IRExpr): string[] {
  ctx.components.set(node.name, `./${kebab(node.name)}`)
  const attrs = [
    ...(key ? [attr("key", key)] : []),
    ...Object.keys(node.props)
      .sort()
      .map((k) => attr(k, node.props[k] as IRExpr)),
  ]
  return [`<${node.name}${attrs.map((a) => ` ${a}`).join("")} />`]
}

function single(node: IRNode, parent: Axis, ctx: Ctx, isRoot: boolean, key?: IRExpr): string[] {
  if (node.kind === "primitive") return elementLines(node, parent, ctx, isRoot, key)
  if (node.kind === "component") return componentLines(node, ctx, key)
  throw new GenError(`nested repeat is not supported (node ${node.id})`)
}

export function emitChild(node: IRNode, parent: Axis, ctx: Ctx): string[] {
  const guard = node.when ? `${emitExpr(node.when, 4)} && ` : ""
  if (node.kind === "repeat") {
    if (node.children.length !== 1) throw new GenError(`repeat must have exactly one child (node ${node.id})`)
    const child = node.children[0] as IRNode
    if (child.when) throw new GenError(`conditional repeat child is not supported (node ${child.id})`)
    const inner = single(child, parent, ctx, false, node.key)
    return [
      `{${guard}${emitExpr(node.over, 19)}.map((${node.as}) => (`,
      ...ind(inner),
      "))}",
    ]
  }
  const lines = single(node, parent, ctx, false)
  if (!node.when) return lines
  if (lines.length === 1) return [`{${guard}${lines[0]}}`]
  return [`{${guard}(`, ...ind(lines), ")}"]
}

export function emitRoot(node: IRNode, ctx: Ctx): string[] {
  if (node.when) throw new GenError(`conditional root is not supported (node ${node.id})`)
  return single(node, "none", ctx, true)
}
