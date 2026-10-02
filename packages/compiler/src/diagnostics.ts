export type Severity = "error" | "warn"

export interface Diagnostic {
  code: string
  severity: Severity
  file: string
  line: number
  col: number
  message: string
}

export function formatDiagnostic(d: Diagnostic): string {
  return `${d.code} ${d.file}:${d.line}:${d.col} ${d.message}`
}
