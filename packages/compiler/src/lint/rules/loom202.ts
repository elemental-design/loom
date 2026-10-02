import { Node, SyntaxKind } from "ts-morph"
import type { Rule } from "../context.js"
import { diag } from "../context.js"

export const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|oklch)\(/

export const loom202: Rule = (ctx) => {
  const out = []
  for (const n of ctx.sf.getDescendants()) {
    const k = n.getKind()
    if (k !== SyntaxKind.StringLiteral && k !== SyntaxKind.NoSubstitutionTemplateLiteral && k !== SyntaxKind.TemplateHead &&
      k !== SyntaxKind.TemplateMiddle && k !== SyntaxKind.TemplateTail) continue
    if (Node.isStringLiteral(n) && n.getParent()?.getKind() === SyntaxKind.ImportDeclaration) continue
    const m = RAW_COLOR.exec(n.getText())
    if (!m) continue
    const { line, column } = ctx.sf.getLineAndColumnAtPos(n.getStart())
    out.push(diag(ctx, "LOOM202", "error", { line, col: column }, `raw color "${m[0]}" is not allowed; use a color token name`))
  }
  return out
}
