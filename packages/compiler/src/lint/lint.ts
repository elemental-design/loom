import { relative } from "node:path"
import type { SourceFile } from "ts-morph"
import type { Diagnostic } from "../diagnostics.js"
import { loadConfig } from "../config.js"
import { extractFile } from "../extract/extract.js"
import { loadProject } from "../extract/project.js"
import type { IRComponent } from "../ir/types.js"
import type { LintContext, Rule } from "./context.js"
import { loom201 } from "./rules/loom201.js"
import { loom202 } from "./rules/loom202.js"
import { loom203 } from "./rules/loom203.js"
import { loom204 } from "./rules/loom204.js"
import { loom205 } from "./rules/loom205.js"
import { loom206 } from "./rules/loom206.js"
import { loom207 } from "./rules/loom207.js"
import { loom208 } from "./rules/loom208.js"
import { loom209 } from "./rules/loom209.js"
import { loom210 } from "./rules/loom210.js"
import { loadVocab, type Vocab } from "./vocab.js"

const RULES: Rule[] = [loom201, loom202, loom203, loom204, loom205, loom206, loom207, loom208, loom209, loom210]

export interface LintInput {
  sf: SourceFile
  /** repo-relative path used in diagnostics */
  file: string
}

const sortDiags = (ds: Diagnostic[]) =>
  ds.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.col - b.col || a.code.localeCompare(b.code))

/** Extracts in memory; extraction errors are returned alone and abort linting. */
export function lintFiles(inputs: LintInput[], vocab: Vocab): Diagnostic[] {
  const sorted = [...inputs].sort((a, b) => a.file.localeCompare(b.file))
  const extracted: { input: LintInput; ir: IRComponent; positions: Map<string, { line: number; col: number }> }[] = []
  const errors: Diagnostic[] = []
  for (const input of sorted) {
    const r = extractFile(input.sf, input.file)
    errors.push(...r.diagnostics)
    if (r.ir && r.positions) extracted.push({ input, ir: r.ir, positions: r.positions })
  }
  if (errors.some((d) => d.severity === "error")) return sortDiags(errors)

  const siblings = extracted.map((x) => ({ ir: x.ir, file: x.input.file }))
  const out: Diagnostic[] = []
  for (const x of extracted) {
    const ctx: LintContext = {
      ir: x.ir,
      sf: x.input.sf,
      file: x.input.file,
      vocab,
      siblings,
      positions: x.positions,
      pos: (id, prop) => x.positions.get(prop ? `${id}@${prop}` : id) ?? x.positions.get(id) ?? { line: 1, col: 1 },
    }
    for (const rule of RULES) out.push(...rule(ctx))
  }
  return sortDiags(out)
}

export async function runLint(cwd: string): Promise<Diagnostic[]> {
  const config = await loadConfig(cwd)
  const vocab = await loadVocab(cwd)
  const project = loadProject(cwd, config.components)
  const inputs = project.getSourceFiles().map((sf) => ({
    sf,
    file: relative(cwd, sf.getFilePath()).split("\\").join("/"),
  }))
  return lintFiles(inputs, vocab)
}

