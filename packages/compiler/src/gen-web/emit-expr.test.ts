import { expect, test } from "vitest"
import type { IRExpr } from "../ir/types.js"
import { emitExpr } from "./emit-expr.js"

const p = (param: string): IRExpr => ({ param })
const l = (lit: string | number | boolean | null): IRExpr => ({ lit })

test("emits JS with minimal parentheses", () => {
  expect(emitExpr({ cond: { op: ">", l: p("n"), r: l(99) }, then: l("99+"), else: { call: "String", arg: p("n") } })).toBe(
    'n > 99 ? "99+" : String(n)',
  )
  expect(emitExpr({ op: "&&", l: { op: "||", l: p("a"), r: p("b") }, r: p("c") })).toBe("(a || b) && c")
  expect(emitExpr({ op: "+", l: l("a"), r: { op: "+", l: p("b"), r: p("c") } })).toBe('"a" + (b + c)')
  expect(emitExpr({ not: { op: "===", l: p("a"), r: l(1) } })).toBe("!(a === 1)")
  expect(emitExpr({ get: { var: "item" }, field: "title" })).toBe("item.title")
  expect(emitExpr({ lookup: { sm: l(2), "2xl": l(5) }, key: p("size") })).toBe('({ "2xl": 5, sm: 2 })[size]')
  expect(emitExpr({ cond: p("a"), then: { cond: p("b"), then: l(1), else: l(2) }, else: l(null) })).toBe(
    "a ? (b ? 1 : 2) : null",
  )
})
