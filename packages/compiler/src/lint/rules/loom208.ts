import type { Rule } from "../context.js"
import { diag } from "../context.js"

export const loom208: Rule = (ctx) => {
  const first = ctx.siblings.find((s) => s.ir.id === ctx.ir.id)
  if (!first || first.file === ctx.file) return []
  const decl = ctx.sf.getVariableDeclaration("loom")
  const { line, column } = decl ? ctx.sf.getLineAndColumnAtPos(decl.getStart()) : { line: 1, column: 1 }
  return [diag(ctx, "LOOM208", "error", { line, col: column }, `duplicate loom.id "${ctx.ir.id}" (first declared in ${first.file})`)]
}
