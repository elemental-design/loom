import { Node, type SourceFile } from "ts-morph"
import type { IRExpr } from "../ir/types.js"
import { substitute } from "../ir/eval.js"
import { fail, toExpr, type ExprCtx } from "./expr.js"

export interface Helpers {
  call: ExprCtx["call"]
}

interface Helper {
  params: string[]
  body: () => IRExpr
}

export function collectHelpers(sf: SourceFile, componentName: string): Helpers {
  const helpers = new Map<string, Helper>()
  const stack: string[] = []

  for (const fn of sf.getFunctions()) {
    if (fn.getName() !== componentName) fail("LOOM105", fn, "helpers must be `const name = (…) => expression` arrows")
  }

  for (const stmt of sf.getVariableStatements()) {
    for (const decl of stmt.getDeclarations()) {
      const nameNode = decl.getNameNode()
      if (!Node.isIdentifier(nameNode)) fail("LOOM105", decl, "helper must be a plain identifier")
      const name = nameNode.getText()
      if (name === "loom") continue
      const init = decl.getInitializer()
      if (!init || !Node.isArrowFunction(init)) fail("LOOM105", decl, `module-level "${name}" is not a pure arrow helper`)
      const arrow = init as import("ts-morph").ArrowFunction
      const body = arrow.getBody()
      if (Node.isBlock(body)) fail("LOOM105", body, `helper "${name}" must have an expression body`)
      const params = arrow.getParameters().map((p) => {
        const pn = p.getNameNode()
        if (!Node.isIdentifier(pn) || p.getInitializer() || p.isRestParameter()) {
          fail("LOOM105", p, `helper "${name}" parameters must be plain identifiers`)
        }
        return pn.getText()
      })
      let cached: IRExpr | undefined
      helpers.set(name, {
        params,
        body: () => {
          if (cached) return cached
          if (stack.includes(name)) fail("LOOM105", decl, `recursive helper "${name}"`)
          stack.push(name)
          cached = toExpr(body, {
            unresolved: "LOOM105",
            ident: (id) => (params.includes(id) ? { param: id } : undefined),
            call,
          })
          stack.pop()
          return cached
        },
      })
    }
  }

  function call(name: string, args: IRExpr[], node: Node): IRExpr | undefined {
    const h = helpers.get(name)
    if (!h) return undefined
    if (h.params.length !== args.length) {
      fail("LOOM105", node, `helper "${name}" expects ${h.params.length} argument(s), got ${args.length}`)
    }
    const map: Record<string, IRExpr> = {}
    h.params.forEach((p, i) => (map[p] = args[i] as IRExpr))
    return substitute(h.body(), map)
  }

  for (const h of helpers.values()) h.body()
  return { call }
}
