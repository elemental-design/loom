import type { IRExpr, IRParam } from "./types.js"

export type Value = string | number | boolean | null | Value[] | { [k: string]: Value }
export type Env = { params: Record<string, Value>; vars: Record<string, Value> }

export class LoomEvalError extends Error {
  readonly code = "LOOM140"
  constructor(message: string) {
    super(`LOOM140 ${message}`)
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function evalExpr(e: IRExpr, env: Env): Value {
  if ("lit" in e) return e.lit
  if ("param" in e) return env.params[e.param] as Value
  if ("var" in e) return env.vars[e.var] as Value
  if ("get" in e) {
    const obj = evalExpr(e.get, env)
    if (obj === null || obj === undefined) throw new LoomEvalError(`cannot read "${e.field}" of ${obj}`)
    return (obj as any)[e.field] as Value
  }
  if ("not" in e) return !evalExpr(e.not, env)
  if ("op" in e) {
    const l: any = evalExpr(e.l, env)
    if (e.op === "&&") return l ? evalExpr(e.r, env) : l
    if (e.op === "||") return l ? l : evalExpr(e.r, env)
    const r: any = evalExpr(e.r, env)
    switch (e.op) {
      case "===": return l === r
      case "!==": return l !== r
      case "<": return l < r
      case ">": return l > r
      case "<=": return l <= r
      case ">=": return l >= r
      case "+": return l + r
    }
  }
  if ("cond" in e) return evalExpr(e.cond, env) ? evalExpr(e.then, env) : evalExpr(e.else, env)
  if ("lookup" in e) {
    const key = String(evalExpr(e.key, env))
    const entry = Object.hasOwn(e.lookup, key) ? e.lookup[key] : undefined
    if (!entry) throw new LoomEvalError(`lookup has no entry for ${key}`)
    return evalExpr(entry, env)
  }
  return String(evalExpr(e.arg, env))
}

export function paramsOfExpr(e: IRExpr): Set<string> {
  const out = new Set<string>()
  const walk = (x: IRExpr): void => {
    if ("param" in x) out.add(x.param)
    else if ("get" in x) walk(x.get)
    else if ("not" in x) walk(x.not)
    else if ("op" in x) (walk(x.l), walk(x.r))
    else if ("cond" in x) (walk(x.cond), walk(x.then), walk(x.else))
    else if ("lookup" in x) (walk(x.key), Object.values(x.lookup).forEach(walk))
    else if ("call" in x) walk(x.arg)
  }
  walk(e)
  return out
}

export function domainOf(p: IRParam): Value[] | undefined {
  if (p.type === "enum") return p.values ? [...p.values] : undefined
  if (p.type === "boolean") return [false, true]
  return undefined
}

export function substitute(e: IRExpr, map: Record<string, IRExpr>): IRExpr {
  const go = (x: IRExpr): IRExpr => {
    if ("param" in x) return Object.hasOwn(map, x.param) ? (map[x.param] as IRExpr) : x
    if ("get" in x) return { get: go(x.get), field: x.field }
    if ("not" in x) return { not: go(x.not) }
    if ("op" in x) return { op: x.op, l: go(x.l), r: go(x.r) }
    if ("cond" in x) return { cond: go(x.cond), then: go(x.then), else: go(x.else) }
    if ("lookup" in x) {
      return { lookup: Object.fromEntries(Object.entries(x.lookup).map(([k, v]) => [k, go(v)])), key: go(x.key) }
    }
    if ("call" in x) return { call: x.call, arg: go(x.arg) }
    return x
  }
  return go(e)
}
