import type { Rule } from "../context.js"
import { diag } from "../context.js"

export const loom210: Rule = (ctx) => {
  if (ctx.sf.getVariableDeclaration("loom")?.getVariableStatement()?.isExported()) return []
  return [diag(ctx, "LOOM210", "error", { line: 1, col: 1 }, "exported component is missing `export const loom` metadata")]
}
