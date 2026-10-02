import type { SourceFile } from "ts-morph"
import type { Diagnostic } from "../diagnostics.js"
import { paramsOfExpr } from "../ir/eval.js"
import type { IRComponent, IRExpr, IRNode, IRParam } from "../ir/types.js"
import type { Vocab } from "./vocab.js"

export interface LintContext {
  ir: IRComponent
  sf: SourceFile
  file: string
  vocab: Vocab
  siblings: { ir: IRComponent; file: string }[]
  positions: Map<string, { line: number; col: number }>
  pos(nodeId: string, prop?: string): { line: number; col: number }
}

export type Rule = (ctx: LintContext) => Diagnostic[]

export function diag(
  ctx: LintContext, code: string, severity: Diagnostic["severity"], at: { line: number; col: number }, message: string,
): Diagnostic {
  return { code, severity, file: ctx.file, line: at.line, col: at.col, message }
}

export interface PropSite {
  node: Extract<IRNode, { kind: "primitive" }>
  prop: string
  expr: IRExpr
  /** loop variables in scope */
  vars: ReadonlySet<string>
}

export function* primitiveProps(root: IRNode, vars: ReadonlySet<string> = new Set()): Generator<PropSite> {
  if (root.kind === "component") return
  const inner = root.kind === "repeat" ? new Set([...vars, root.as]) : vars
  if (root.kind === "primitive") {
    for (const [prop, expr] of Object.entries(root.props)) yield { node: root, prop, expr, vars: inner }
  }
  for (const c of root.children) yield* primitiveProps(c, inner)
}

export function usesVar(e: IRExpr): boolean {
  if ("var" in e) return true
  if ("get" in e) return usesVar(e.get)
  if ("not" in e) return usesVar(e.not)
  if ("op" in e) return usesVar(e.l) || usesVar(e.r)
  if ("cond" in e) return usesVar(e.cond) || usesVar(e.then) || usesVar(e.else)
  if ("lookup" in e) return usesVar(e.key) || Object.values(e.lookup).some(usesVar)
  if ("call" in e) return usesVar(e.arg)
  return false
}

export const paramByName = (ir: IRComponent, name: string): IRParam | undefined =>
  ir.params.find((p) => p.name === name)

export { paramsOfExpr }
