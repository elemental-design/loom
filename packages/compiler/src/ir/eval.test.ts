import { describe, expect, test } from "vitest"
import { domainOf, evalExpr, paramsOfExpr, substitute, type Env } from "./eval.js"
import type { IRExpr } from "./types.js"

const env = (params: Env["params"] = {}, vars: Env["vars"] = {}): Env => ({ params, vars })
const lit = (v: string | number | boolean | null): IRExpr => ({ lit: v })
const p = (name: string): IRExpr => ({ param: name })

describe("evalExpr", () => {
  test("lit/param/var/get", () => {
    expect(evalExpr(lit(3), env())).toBe(3)
    expect(evalExpr(p("a"), env({ a: "x" }))).toBe("x")
    expect(evalExpr({ var: "i" }, env({}, { i: 7 }))).toBe(7)
    expect(evalExpr({ get: { var: "i" }, field: "t" }, env({}, { i: { t: "hi" } }))).toBe("hi")
  })
  test("not and truthiness", () => {
    for (const v of ["", 0, null]) expect(evalExpr({ not: lit(v) }, env())).toBe(true)
    expect(evalExpr({ not: p("missing") }, env())).toBe(true)
    expect(evalExpr({ not: lit("a") }, env())).toBe(false)
  })
  test("binary ops", () => {
    const op = (o: any, l: IRExpr, r: IRExpr) => evalExpr({ op: o, l, r }, env())
    expect(op("===", lit(1), lit(1))).toBe(true)
    expect(op("!==", lit(1), lit(1))).toBe(false)
    expect(op("<", lit(1), lit(2))).toBe(true)
    expect(op(">", lit(1), lit(2))).toBe(false)
    expect(op("<=", lit(2), lit(2))).toBe(true)
    expect(op(">=", lit(1), lit(2))).toBe(false)
    expect(op("+", lit("a"), lit(1))).toBe("a1")
    expect(op("+", lit(1), lit(2))).toBe(3)
    expect(op("&&", lit(""), lit("x"))).toBe("")
    expect(op("&&", lit(1), lit("x"))).toBe("x")
    expect(op("||", lit(0), lit("x"))).toBe("x")
    expect(op("||", lit("a"), lit("x"))).toBe("a")
  })
  test("cond", () => {
    const e: IRExpr = { cond: p("c"), then: lit("y"), else: lit("n") }
    expect(evalExpr(e, env({ c: 1 }))).toBe("y")
    expect(evalExpr(e, env({ c: "" }))).toBe("n")
    expect(evalExpr(e, env({ c: 0 }))).toBe("n")
    expect(evalExpr(e, env({ c: null }))).toBe("n")
    expect(evalExpr(e, env())).toBe("n")
  })
  test("lookup", () => {
    const e: IRExpr = { lookup: { a: lit(1), b: lit(2) }, key: p("k") }
    expect(evalExpr(e, env({ k: "b" }))).toBe(2)
    expect(() => evalExpr(e, env({ k: "z" }))).toThrow(/LOOM140.*no entry for z/)
    expect(() => evalExpr(e, env())).toThrow(/LOOM140/)
  })
  test("String", () => {
    expect(evalExpr({ call: "String", arg: lit(5) }, env())).toBe("5")
  })
})

test("paramsOfExpr", () => {
  const e: IRExpr = { cond: p("a"), then: { lookup: { x: p("b") }, key: p("c") }, else: { call: "String", arg: { get: p("d"), field: "f" } } }
  expect([...paramsOfExpr(e)].sort()).toEqual(["a", "b", "c", "d"])
})

test("domainOf", () => {
  expect(domainOf({ name: "a", type: "enum", required: true, values: ["x", "y"] })).toEqual(["x", "y"])
  expect(domainOf({ name: "a", type: "boolean", required: true })).toEqual([false, true])
  expect(domainOf({ name: "a", type: "string", required: true })).toBeUndefined()
})

test("substitute is simultaneous", () => {
  const e: IRExpr = { op: "+", l: p("a"), r: p("b") }
  expect(substitute(e, { a: p("b"), b: p("a") })).toEqual({ op: "+", l: p("b"), r: p("a") })
})
