import { Node, SyntaxKind } from "ts-morph"
import type { IRExpr } from "../ir/types.js"

export class ExtractError extends Error {
  constructor(
    readonly code: string,
    readonly node: Node,
    message: string,
  ) {
    super(message)
  }
}

export const fail = (code: string, node: Node, message: string): never => {
  throw new ExtractError(code, node, message)
}

export interface ExprCtx {
  ident(name: string): IRExpr | undefined
  call(name: string, args: IRExpr[], node: Node): IRExpr | undefined
  /** code raised for an identifier that is not in scope */
  unresolved: "LOOM104" | "LOOM105"
}

export function unwrap(n: Node): Node {
  while (
    Node.isParenthesizedExpression(n) ||
    Node.isAsExpression(n) ||
    Node.isSatisfiesExpression(n) ||
    Node.isTypeAssertion(n)
  ) {
    n = n.getExpression()
  }
  return n
}

const BINARY = new Set(["===", "!==", "<", ">", "<=", ">=", "&&", "||", "+"])
type BinOp = Extract<IRExpr, { op: string }>["op"]

export function toExpr(raw: Node, ctx: ExprCtx): IRExpr {
  const n = unwrap(raw)
  const bad = (what: string): never => fail("LOOM104", n, `unsupported expression: ${what}`)

  if (Node.isStringLiteral(n)) return { lit: n.getLiteralValue() }
  if (Node.isNumericLiteral(n)) return { lit: n.getLiteralValue() }
  if (n.getKind() === SyntaxKind.TrueKeyword) return { lit: true }
  if (n.getKind() === SyntaxKind.FalseKeyword) return { lit: false }
  if (n.getKind() === SyntaxKind.NullKeyword) return { lit: null }

  if (Node.isPrefixUnaryExpression(n)) {
    const op = n.getOperatorToken()
    const operand = unwrap(n.getOperand())
    if (op === SyntaxKind.ExclamationToken) return { not: toExpr(operand, ctx) }
    if (op === SyntaxKind.MinusToken && Node.isNumericLiteral(operand)) return { lit: -operand.getLiteralValue() }
    return bad(n.getText())
  }

  if (Node.isIdentifier(n)) {
    const r = ctx.ident(n.getText())
    return r ?? fail(ctx.unresolved, n, `identifier "${n.getText()}" is not a param, loop variable, or pure helper parameter`)
  }

  if (Node.isPropertyAccessExpression(n)) {
    if (n.hasQuestionDotToken()) return bad("optional chaining")
    const field = n.getName()
    if (field === "length") return bad(".length")
    return { get: toExpr(n.getExpression(), ctx), field }
  }

  if (Node.isBinaryExpression(n)) {
    const op = n.getOperatorToken().getText()
    if (!BINARY.has(op)) return bad(`operator ${op}`)
    return { op: op as BinOp, l: toExpr(n.getLeft(), ctx), r: toExpr(n.getRight(), ctx) }
  }

  if (Node.isConditionalExpression(n)) {
    return {
      cond: toExpr(n.getCondition(), ctx),
      then: toExpr(n.getWhenTrue(), ctx),
      else: toExpr(n.getWhenFalse(), ctx),
    }
  }

  if (Node.isCallExpression(n)) {
    const callee = n.getExpression()
    if (n.hasQuestionDotToken() || !Node.isIdentifier(callee)) return bad("call")
    const args = n.getArguments()
    const name = callee.getText()
    const converted = args.map((a) => (Node.isSpreadElement(a) ? bad("spread argument") : toExpr(a, ctx)))
    if (name === "String" && converted.length === 1) return { call: "String", arg: converted[0] as IRExpr }
    return ctx.call(name, converted, n) ?? bad(`call to "${name}" (not String or a pure helper)`)
  }

  if (Node.isElementAccessExpression(n)) {
    const obj = unwrap(n.getExpression())
    const arg = n.getArgumentExpression()
    if (n.hasQuestionDotToken() || !Node.isObjectLiteralExpression(obj) || !arg) return bad("element access")
    const lookup: Record<string, IRExpr> = {}
    for (const p of obj.getProperties()) {
      if (!Node.isPropertyAssignment(p)) return bad("object literal member")
      const nameNode = p.getNameNode()
      let key: string
      if (Node.isIdentifier(nameNode)) key = nameNode.getText()
      else if (Node.isStringLiteral(nameNode)) key = nameNode.getLiteralValue()
      else if (Node.isNumericLiteral(nameNode)) key = String(nameNode.getLiteralValue())
      else return bad("computed lookup key")
      const init = p.getInitializer()
      if (!init) return bad("object literal member")
      lookup[key] = toExpr(init, ctx)
    }
    return { lookup, key: toExpr(arg, ctx) }
  }

  if (Node.isTemplateExpression(n) || Node.isNoSubstitutionTemplateLiteral(n)) return bad("template literal")
  return bad(n.getKindName())
}
