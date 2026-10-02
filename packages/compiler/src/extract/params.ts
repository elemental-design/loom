import { Node, SyntaxKind, type FunctionDeclaration, type SourceFile, type TypeNode } from "ts-morph"
import type { IRParam } from "../ir/types.js"
import { fail, unwrap } from "./expr.js"

type Prim = "string" | "number" | "boolean"

const primOf = (t: TypeNode): Prim | undefined => {
  switch (t.getKind()) {
    case SyntaxKind.StringKeyword: return "string"
    case SyntaxKind.NumberKeyword: return "number"
    case SyntaxKind.BooleanKeyword: return "boolean"
    default: return undefined
  }
}

function enumValues(t: TypeNode, sf: SourceFile, depth = 0): string[] | undefined {
  if (Node.isParenthesizedTypeNode(t)) return enumValues(t.getTypeNode(), sf, depth)
  if (Node.isLiteralTypeNode(t)) {
    const lit = t.getLiteral()
    return Node.isStringLiteral(lit) ? [lit.getLiteralValue()] : undefined
  }
  if (Node.isUnionTypeNode(t)) {
    const out: string[] = []
    for (const m of t.getTypeNodes()) {
      const v = enumValues(m, sf, depth)
      if (!v) return undefined
      out.push(...v)
    }
    return out
  }
  if (Node.isTypeReference(t) && depth < 8) {
    const alias = sf.getTypeAlias(t.getTypeName().getText())
    const target = alias?.getTypeNode()
    return target ? enumValues(target, sf, depth + 1) : undefined
  }
  return undefined
}

function paramType(t: TypeNode, sf: SourceFile): Pick<IRParam, "type" | "values" | "fields"> {
  const prim = primOf(t)
  if (prim) return { type: prim }
  if (Node.isTypeReference(t)) {
    const name = t.getTypeName().getText()
    if (name === "IconName") return { type: "icon" }
    if (name === "ReactNode" || name === "React.ReactNode") return { type: "child" }
  }
  if (Node.isFunctionTypeNode(t) && t.getParameters().length === 0 && t.getReturnTypeNode()?.getKind() === SyntaxKind.VoidKeyword) {
    return { type: "action" }
  }
  const values = enumValues(t, sf)
  if (values) return { type: "enum", values }
  if (Node.isArrayTypeNode(t)) {
    const el = t.getElementTypeNode()
    if (Node.isTypeLiteral(el)) {
      const fields: { name: string; type: Prim }[] = []
      for (const m of el.getMembers()) {
        const ft = Node.isPropertySignature(m) ? m.getTypeNode() : undefined
        const fp = ft && primOf(ft)
        if (!Node.isPropertySignature(m) || !fp) return fail("LOOM101", m, "array fields must be string, number, or boolean")
        fields.push({ name: m.getName(), type: fp })
      }
      return { type: "array", fields }
    }
  }
  return fail("LOOM101", t, `unsupported prop type: ${t.getText()}`)
}

function literalDefault(init: Node): string | number | boolean {
  const n = unwrap(init)
  if (Node.isStringLiteral(n)) return n.getLiteralValue()
  if (Node.isNumericLiteral(n)) return n.getLiteralValue()
  if (n.getKind() === SyntaxKind.TrueKeyword) return true
  if (n.getKind() === SyntaxKind.FalseKeyword) return false
  if (Node.isPrefixUnaryExpression(n) && n.getOperatorToken() === SyntaxKind.MinusToken) {
    const o = unwrap(n.getOperand())
    if (Node.isNumericLiteral(o)) return -o.getLiteralValue()
  }
  return fail("LOOM104", init, "param defaults must be literals")
}

const docOf = (n: { getJsDocs(): { getDescription(): string }[] }): string | undefined => {
  const d = n.getJsDocs().map((j) => j.getDescription().trim()).filter(Boolean).join("\n")
  return d || undefined
}

export const componentDoc = (fn: FunctionDeclaration): string | undefined => docOf(fn)

export function extractParams(sf: SourceFile, fn: FunctionDeclaration): IRParam[] {
  const first = fn.getParameters()[0]
  if (!first) return []
  const typeNode = first.getTypeNode()
  if (!typeNode || !Node.isTypeReference(typeNode)) return fail("LOOM101", first, "props must be typed with a named interface")
  const iface = sf.getInterface(typeNode.getTypeName().getText())
  if (!iface) return fail("LOOM101", typeNode, `interface ${typeNode.getText()} not found in this file`)
  if (iface.getExtends().length > 0) return fail("LOOM101", iface, "props interface must not extend another type")

  const params: IRParam[] = iface.getMembers().map((m) => {
    if (!Node.isPropertySignature(m)) return fail("LOOM101", m, "props interface may only contain properties")
    const t = m.getTypeNode()
    if (!t) return fail("LOOM101", m, "prop needs a type annotation")
    const p: IRParam = { name: m.getName(), required: !m.hasQuestionToken(), ...paramType(t, sf) }
    const doc = docOf(m)
    if (doc) p.doc = doc
    return p
  })

  const pattern = first.getNameNode()
  if (!Node.isObjectBindingPattern(pattern)) return fail("LOOM104", first, "props must be destructured in the parameter list")
  for (const el of pattern.getElements()) {
    const nameNode = el.getNameNode()
    if (!Node.isIdentifier(nameNode) || el.getPropertyNameNode() || el.getDotDotDotToken()) {
      fail("LOOM104", el, "props destructuring must use plain names (no rename, rest, or nesting)")
    }
    const param = params.find((p) => p.name === nameNode.getText())
    if (!param) fail("LOOM101", el, `"${nameNode.getText()}" is not declared in the props interface`)
    const init = el.getInitializer()
    if (init && param) param.default = literalDefault(init)
  }
  return params
}
