import type { IRExpr } from "../ir/types.js"

const PREC: Record<string, number> = {
  "||": 3, "&&": 4, "===": 8, "!==": 8, "<": 9, ">": 9, "<=": 9, ">=": 9, "+": 11,
}
const COND = 2
const NOT = 15
const MEMBER = 19
const ATOM = 20

const IDENT = /^[A-Za-z_$][\w$]*$/

const prec = (e: IRExpr): number => {
  if ("op" in e) return PREC[e.op] as number
  if ("cond" in e) return COND
  if ("not" in e) return NOT
  if ("get" in e || "lookup" in e) return MEMBER
  return ATOM
}

export const emitKey = (k: string): string => (IDENT.test(k) ? k : JSON.stringify(k))

export function emitExpr(e: IRExpr, min = 0): string {
  const s = raw(e)
  return prec(e) < min ? `(${s})` : s
}

function raw(e: IRExpr): string {
  if ("lit" in e) return JSON.stringify(e.lit)
  if ("param" in e) return e.param
  if ("var" in e) return e.var
  if ("get" in e) return `${emitExpr(e.get, MEMBER)}.${e.field}`
  if ("not" in e) return `!${emitExpr(e.not, NOT)}`
  if ("op" in e) {
    const p = PREC[e.op] as number
    return `${emitExpr(e.l, p)} ${e.op} ${emitExpr(e.r, p + 1)}`
  }
  if ("cond" in e) return `${emitExpr(e.cond, COND + 1)} ? ${emitExpr(e.then, COND + 1)} : ${emitExpr(e.else, COND)}`
  if ("lookup" in e) {
    const entries = Object.keys(e.lookup)
      .sort()
      .map((k) => `${emitKey(k)}: ${emitExpr(e.lookup[k] as IRExpr, COND + 1)}`)
    return `({ ${entries.join(", ")} })[${emitExpr(e.key)}]`
  }
  return `String(${emitExpr(e.arg)})`
}
