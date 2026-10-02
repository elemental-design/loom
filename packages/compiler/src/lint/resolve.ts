import { domainOf, evalExpr, paramsOfExpr, type Value } from "../ir/eval.js"
import type { IRComponent, IRExpr } from "../ir/types.js"
import { usesVar } from "./context.js"

export type Resolved =
  | { kind: "open"; reason: string }
  | { kind: "compound"; params: string[] }
  | { kind: "error"; message: string }
  | { kind: "set"; values: Value[] }

export function resolveValues(ir: IRComponent, e: IRExpr): Resolved {
  if (usesVar(e)) return { kind: "open", reason: "depends on a loop variable" }
  const names = [...paramsOfExpr(e)].sort()
  const domains: Value[][] = []
  for (const n of names) {
    const p = ir.params.find((x) => x.name === n)
    const d = p && domainOf(p)
    if (!d) return { kind: "open", reason: `depends on non-closed param "${n}"` }
    domains.push(d)
  }
  if (names.length > 1) return { kind: "compound", params: names }

  const out: Value[] = []
  const seen = new Set<string>()
  const combos = domains.reduce<Value[][]>((acc, d) => acc.flatMap((c) => d.map((v) => [...c, v])), [[]])
  try {
    for (const combo of combos) {
      const params: Record<string, Value> = {}
      names.forEach((n, i) => (params[n] = combo[i] as Value))
      const v = evalExpr(e, { params, vars: {} })
      const k = JSON.stringify(v)
      if (!seen.has(k)) (seen.add(k), out.push(v))
    }
  } catch (err) {
    return { kind: "error", message: err instanceof Error ? err.message : String(err) }
  }
  return { kind: "set", values: out }
}
