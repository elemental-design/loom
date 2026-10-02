import type { Rule } from "../context.js"
import { diag, paramByName } from "../context.js"
import type { Diagnostic } from "../../diagnostics.js"
import { primitiveProps } from "../context.js"
import { resolveValues } from "../resolve.js"

export const loom209: Rule = (ctx) => {
  const out: Diagnostic[] = []
  for (const { node, prop, expr } of primitiveProps(ctx.ir.root)) {
    if (node.type !== "Icon" || prop !== "name") continue
    if ("param" in expr && paramByName(ctx.ir, expr.param)?.type === "icon") continue
    const r = resolveValues(ctx.ir, expr)
    if (r.kind === "open") out.push(diag(ctx, "LOOM209", "error", ctx.pos(node.id, prop), `Icon.name must be statically known (${r.reason})`))
  }
  return out
}
