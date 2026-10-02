import type { Rule } from "../context.js"
import { diag } from "../context.js"

const isLoomRel = (s: string) => s.startsWith(".") && /\.loom(\.tsx)?$/.test(s)

export const loom201: Rule = (ctx) =>
  ctx.sf.getImportDeclarations().flatMap((imp) => {
    const spec = imp.getModuleSpecifierValue()
    if (spec === "@loom/primitives" || isLoomRel(spec)) return []
    if (spec === "react") {
      const typeOnly = imp.isTypeOnly() || (imp.getNamedImports().length > 0 && imp.getNamedImports().every((n) => n.isTypeOnly()) && !imp.getDefaultImport() && !imp.getNamespaceImport())
      if (typeOnly) return []
    }
    const { line, column } = ctx.sf.getLineAndColumnAtPos(imp.getStart())
    return [diag(ctx, "LOOM201", "error", { line, col: column }, `import from "${spec}" is not allowed`)]
  })
