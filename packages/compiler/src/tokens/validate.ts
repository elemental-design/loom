import type { ColorRole, TokensDef } from "./define.js"
import type { Diagnostic } from "../diagnostics.js"

export const TOKENS_FILE = "loom.tokens.ts"
export const TOKENS_POS = { line: 1, col: 1 }

export function validateTokens(def: TokensDef): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const base = { file: TOKENS_FILE, ...TOKENS_POS }

  // LOOM001 — missing/empty comment on a role
  for (const [name, role] of Object.entries(def.colors)) {
    if (!role.comment || role.comment.trim() === "") {
      diagnostics.push({
        code: "LOOM001",
        severity: "error",
        ...base,
        message: `role "${name}" is missing a comment`,
      })
    }
  }

  // LOOM002 — role references unknown seed
  for (const [name, role] of Object.entries(def.colors)) {
    if (!(role.from in def.seeds)) {
      diagnostics.push({
        code: "LOOM002",
        severity: "error",
        ...base,
        message: `role "${name}" references unknown seed "${role.from}"`,
      })
    }
  }

  // LOOM003 — tone not integer 0–100
  for (const [name, role] of Object.entries(def.colors)) {
    if (!Number.isInteger(role.tone) || role.tone < 0 || role.tone > 100) {
      diagnostics.push({
        code: "LOOM003",
        severity: "error",
        ...base,
        message: `role "${name}" has tone ${role.tone}, expected integer 0–100`,
      })
    }
  }

  // LOOM004 — invalid hex seed
  for (const [name, seed] of Object.entries(def.seeds)) {
    if (!/^#[0-9a-fA-F]{6}$/.test(seed)) {
      diagnostics.push({
        code: "LOOM004",
        severity: "error",
        ...base,
        message: `seed "${name}" has invalid hex color "${seed}"`,
      })
    }
  }

  // LOOM005 — spacing keys not positive integers, values not positive numbers
  for (const [key, value] of Object.entries(def.spacing)) {
    if (!/^\d+$/.test(key) || Number.parseInt(key, 10) <= 0) {
      diagnostics.push({
        code: "LOOM005",
        severity: "error",
        ...base,
        message: `spacing key "${key}" is not a positive integer`,
      })
    }
    if (typeof value !== "number" || !(value > 0)) {
      diagnostics.push({
        code: "LOOM005",
        severity: "error",
        ...base,
        message: `spacing["${key}"] = ${value} is not a positive number`,
      })
    }
  }

  return diagnostics
}

// re-exported for convenience of callers wiring up T02
export type { ColorRole, TokensDef }
