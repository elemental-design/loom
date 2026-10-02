import { Node, type JsxAttributeLike, type JsxElement, type JsxSelfClosingElement } from "ts-morph"
import type { IRExpr, IRNode, PrimitiveName } from "../ir/types.js"
import { fail, toExpr, unwrap, type ExprCtx } from "./expr.js"

export interface JsxEnv {
  params: Set<string>
  call: ExprCtx["call"]
  resolveRef(tag: string): { ref: string; name: string } | undefined
}

const PRIMITIVES = new Set<string>([
  "HStack", "VStack", "ZStack", "Spacer", "Divider", "Text", "Image", "Icon", "Pressable",
])

type Vars = ReadonlySet<string>
type Alloc = () => string

const exprCtx = (env: JsxEnv, vars: Vars): ExprCtx => ({
  unresolved: "LOOM104",
  call: env.call,
  ident: (n) => (vars.has(n) ? { var: n } : env.params.has(n) ? { param: n } : undefined),
})

const and = (a: IRExpr | undefined, b: IRExpr): IRExpr => (a ? { op: "&&", l: a, r: b } : b)

function jsxText(raw: string): string {
  const lines = raw.split(/\r\n|\n|\r/)
  const out: string[] = []
  lines.forEach((line, i) => {
    let l = line.replace(/\t/g, " ")
    if (i > 0) l = l.trimStart()
    if (i < lines.length - 1) l = l.trimEnd()
    if (l) out.push(l)
  })
  return out.join(" ")
}

const isElement = (n: Node): n is JsxElement | JsxSelfClosingElement =>
  Node.isJsxElement(n) || Node.isJsxSelfClosingElement(n)

function isNodeish(raw: Node): boolean {
  const n = unwrap(raw)
  if (isElement(n) || Node.isJsxFragment(n)) return true
  if (Node.isCallExpression(n)) {
    const c = n.getExpression()
    return Node.isPropertyAccessExpression(c) && c.getName() === "map"
  }
  if (Node.isConditionalExpression(n)) return isNodeish(n.getWhenTrue()) || isNodeish(n.getWhenFalse())
  if (Node.isBinaryExpression(n) && n.getOperatorToken().getText() === "&&") return isNodeish(n.getRight())
  return false
}

function buildProps(attrs: JsxAttributeLike[], ctx: ExprCtx, skip?: string): Record<string, IRExpr> {
  const props: Record<string, IRExpr> = {}
  for (const a of attrs) {
    if (Node.isJsxSpreadAttribute(a)) return fail("LOOM102", a, "JSX spread attributes are not allowed")
    const name = a.getNameNode().getText()
    if (name.includes(":")) fail("LOOM104", a, "namespaced attributes are not supported")
    if (name === skip) continue
    const init = a.getInitializer()
    if (!init) props[name] = { lit: true }
    else if (Node.isStringLiteral(init)) props[name] = { lit: init.getLiteralValue() }
    else if (Node.isJsxExpression(init)) {
      const e = init.getExpression()
      if (!e) fail("LOOM104", init, "empty attribute expression")
      else props[name] = toExpr(e, ctx)
    } else fail("LOOM104", init, "unsupported attribute value")
  }
  return props
}

function buildElement(el: JsxElement | JsxSelfClosingElement, id: string, vars: Vars, env: JsxEnv, skip?: string): IRNode {
  const tag = (Node.isJsxElement(el) ? el.getOpeningElement() : el).getTagNameNode().getText()
  const ctx = exprCtx(env, vars)
  const attrs = Node.isJsxElement(el) ? el.getOpeningElement().getAttributes() : el.getAttributes()
  const children = Node.isJsxElement(el) ? el.getJsxChildren() : []
  const props = buildProps(attrs, ctx, skip)

  if (PRIMITIVES.has(tag)) {
    const type = tag as PrimitiveName
    if (type === "Text") {
      const content = foldText(children, ctx)
      if (content) props.content = content
      return { kind: "primitive", id, type, props, children: [] }
    }
    return { kind: "primitive", id, type, props, children: buildChildren(children, id, vars, env) }
  }

  const ref = env.resolveRef(tag)
  if (!ref) return fail("LOOM110", el, `unknown JSX element <${tag}>: not a primitive or an imported loom component`)
  for (const c of children) {
    if (!(Node.isJsxText(c) && !jsxText(c.getFullText()))) fail("LOOM104", c, "children of loom components are not supported")
  }
  return { kind: "component", id, ref: ref.ref, name: ref.name, props }
}

function foldText(children: Node[], ctx: ExprCtx): IRExpr | undefined {
  const parts: IRExpr[] = []
  for (const c of children) {
    if (Node.isJsxText(c)) {
      const t = jsxText(c.getFullText())
      if (t) parts.push({ lit: t })
    } else if (Node.isJsxExpression(c)) {
      const e = c.getExpression()
      if (e) parts.push(toExpr(e, ctx))
    } else fail(Node.isJsxFragment(c) ? "LOOM103" : "LOOM104", c, "Text may only contain text and {expressions}")
  }
  return parts.reduce<IRExpr | undefined>((acc, p) => (acc ? { op: "+", l: acc, r: p } : p), undefined)
}

function buildChildren(children: Node[], parentId: string, vars: Vars, env: JsxEnv): IRNode[] {
  let idx = 0
  const alloc: Alloc = () => `${parentId}.${idx++}`
  const out: IRNode[] = []
  for (const c of children) {
    if (Node.isJsxText(c)) {
      if (jsxText(c.getFullText())) fail("LOOM104", c, "text is only allowed inside Text")
    } else if (Node.isJsxExpression(c)) {
      const e = c.getExpression()
      if (e) out.push(...buildNodes(e, alloc, vars, env))
    } else out.push(...buildNodes(c, alloc, vars, env))
  }
  return out
}

function buildNodes(raw: Node, alloc: Alloc, vars: Vars, env: JsxEnv, when?: IRExpr): IRNode[] {
  const n = unwrap(raw)
  const ctx = exprCtx(env, vars)

  if (isElement(n)) {
    const node = buildElement(n, alloc(), vars, env)
    if (when) node.when = when
    return [node]
  }
  if (Node.isJsxFragment(n)) return fail("LOOM103", n, "JSX fragments are not allowed")
  if (n.getKindName() === "NullKeyword") return []

  if (Node.isBinaryExpression(n) && n.getOperatorToken().getText() === "&&" && isNodeish(n.getRight())) {
    return buildNodes(n.getRight(), alloc, vars, env, and(when, toExpr(n.getLeft(), ctx)))
  }

  if (Node.isConditionalExpression(n) && (isNodeish(n.getWhenTrue()) || isNodeish(n.getWhenFalse()))) {
    const c = toExpr(n.getCondition(), ctx)
    return [
      ...buildNodes(n.getWhenTrue(), alloc, vars, env, and(when, c)),
      ...buildNodes(n.getWhenFalse(), alloc, vars, env, and(when, { not: c })),
    ]
  }

  if (Node.isCallExpression(n) && isNodeish(n)) {
    const callee = n.getExpression()
    const arrow = n.getArguments()[0]
    if (!Node.isPropertyAccessExpression(callee) || n.getArguments().length !== 1 || !arrow || !Node.isArrowFunction(arrow)) {
      return fail("LOOM104", n, ".map requires a single arrow function callback")
    }
    const ps = arrow.getParameters()
    const p = ps[0]
    if (ps.length !== 1 || !p || !Node.isIdentifier(p.getNameNode())) {
      return fail("LOOM104", arrow, ".map callback must take exactly one plain identifier")
    }
    const body = unwrap(arrow.getBody())
    if (Node.isBlock(body)) return fail("LOOM104", body, ".map callback must have an expression body")
    if (Node.isJsxFragment(body)) return fail("LOOM103", body, "JSX fragments are not allowed")
    if (!isElement(body)) return fail("LOOM104", body, ".map callback must return a single JSX element")

    const as = p.getName()
    const inner = new Set([...vars, as])
    const attrs = Node.isJsxElement(body) ? body.getOpeningElement().getAttributes() : body.getAttributes()
    const keyAttr = attrs.find((a) => Node.isJsxAttribute(a) && a.getNameNode().getText() === "key")
    if (!keyAttr || !Node.isJsxAttribute(keyAttr)) return fail("LOOM107", body, ".map element requires a key attribute")
    const keyInit = keyAttr.getInitializer()
    const keyNode = keyInit && Node.isJsxExpression(keyInit) ? keyInit.getExpression() : keyInit
    if (!keyNode) return fail("LOOM107", keyAttr, "key must have a value")

    const id = alloc()
    let idx = 0
    const child = buildElement(body, `${id}.${idx++}`, inner, env, "key")
    const node: IRNode = {
      kind: "repeat",
      id,
      over: toExpr(callee.getExpression(), ctx),
      as,
      key: toExpr(keyNode, exprCtx(env, inner)),
      children: [child],
    }
    if (when) node.when = when
    return [node]
  }

  return fail("LOOM104", n, "expression children are only allowed inside Text (or as `cond && <El/>`, ternary, `.map`)")
}

export function buildRoot(expr: Node, env: JsxEnv): IRNode {
  const n = unwrap(expr)
  if (Node.isJsxFragment(n)) return fail("LOOM103", n, "JSX fragments are not allowed")
  if (!isElement(n)) return fail("LOOM104", n, "component must return a single JSX element")
  return buildElement(n, "n0", new Set(), env)
}
