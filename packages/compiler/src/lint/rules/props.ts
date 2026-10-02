import type { Value } from "../../ir/eval.js"
import type { Diagnostic } from "../../diagnostics.js"
import { diag, primitiveProps, type Rule } from "../context.js"
import { resolveValues } from "../resolve.js"
import { PROP_KINDS, isStyleKind } from "../style-props.js"
import { RAW_COLOR } from "./loom202.js"

const show = (vs: Value[]) => vs.map((v) => JSON.stringify(v)).join(", ")

/** LOOM203, 204, 205, 206, 207 share the resolved value set of each style prop. */
export function propRules(codes: ReadonlySet<string>): Rule {
  return (ctx) => {
    const out: Diagnostic[] = []
    for (const { node, prop, expr } of primitiveProps(ctx.ir.root)) {
      const kind = PROP_KINDS[node.type][prop]
      if (!isStyleKind(kind)) continue
      const at = ctx.pos(node.id, prop)
      const where = `${node.type}.${prop}`
      const r = resolveValues(ctx.ir, expr)
      const emit = (code: string, sev: "error" | "warn", msg: string) => {
        if (codes.has(code)) out.push(diag(ctx, code, sev, at, msg))
      }
      if (r.kind === "open") emit("LOOM205", "error", `${where} is not statically resolvable (${r.reason})`)
      else if (r.kind === "compound") emit("LOOM207", "error", `${where} depends on more than one param (${r.params.join(", ")})`)
      else if (r.kind === "error") emit("LOOM140", "error", `${where}: ${r.message}`)
      else {
        const bad = (ok: (v: Value) => boolean) => r.values.filter((v) => !ok(v) && !(typeof v === "string" && RAW_COLOR.test(v)))
        const inSet = (s: ReadonlySet<string>) => (v: Value) => (typeof v === "string" || typeof v === "number") && s.has(String(v))
        if (kind === "color") {
          const b = bad(inSet(ctx.vocab.colors))
          if (b.length) emit("LOOM203", "error", `${where} may resolve to unknown color ${show(b)}`)
        } else if (kind === "spacing") {
          const b = bad((v) => typeof v === "number" && ctx.vocab.spacing.has(String(v)))
          if (b.length) emit("LOOM204", "error", `${where} may resolve to ${show(b)}, not in the spacing scale`)
        } else if (kind === "radius") {
          const b = bad((v) => typeof v === "string" && ctx.vocab.radius.has(v))
          if (b.length) emit("LOOM204", "error", `${where} may resolve to ${show(b)}, not a radius name`)
        } else if (kind === "typography") {
          const b = bad((v) => typeof v === "string" && ctx.vocab.typography.has(v))
          if (b.length) emit("LOOM204", "error", `${where} may resolve to ${show(b)}, not a typography name`)
        } else if (kind === "px") {
          const b = r.values.filter((v) => typeof v === "number" && v % 4 !== 0)
          if (b.length) emit("LOOM206", "warn", `${where} ${show(b)} is off-scale (not a multiple of 4)`)
        }
      }
    }
    return out
  }
}
