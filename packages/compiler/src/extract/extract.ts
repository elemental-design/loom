import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { basename, relative, resolve } from "node:path"
import { Node, SyntaxKind, type SourceFile } from "ts-morph"
import type { Diagnostic } from "../diagnostics.js"
import { loadConfig } from "../config.js"
import type { IRComponent } from "../ir/types.js"
import { writeJson } from "../ir/write.js"
import { ExtractError, fail, unwrap } from "./expr.js"
import { collectHelpers } from "./helpers.js"
import { buildRoot } from "./jsx.js"
import { componentDoc, extractParams } from "./params.js"
import { loadProject } from "./project.js"

const ID_RE = /^cmp_[a-z][a-z0-9_]*$/

function readLoom(sf: SourceFile): { id: string; version: string } {
  const decl = sf.getVariableDeclaration("loom")
  const stmt = decl?.getVariableStatement()
  if (!decl || !stmt?.isExported()) return fail("LOOM108", sf, "missing `export const loom = { id, version } as const`")
  const obj = decl.getInitializer() && unwrap(decl.getInitializer() as Node)
  if (!obj || !Node.isObjectLiteralExpression(obj)) return fail("LOOM108", decl, "`loom` must be an object literal")
  const str = (key: string): string => {
    const p = obj.getProperty(key)
    const init = p && Node.isPropertyAssignment(p) ? p.getInitializer() : undefined
    if (!init || !Node.isStringLiteral(init)) return fail("LOOM108", p ?? obj, `loom.${key} must be a string literal`)
    return init.getLiteralValue()
  }
  const id = str("id")
  if (!ID_RE.test(id)) fail("LOOM108", obj, `loom.id "${id}" must match cmp_<snake_name>`)
  return { id, version: str("version") }
}

const BANNED_KINDS = new Map<SyntaxKind, string>([
  [SyntaxKind.ClassDeclaration, "class"],
  [SyntaxKind.ClassExpression, "class"],
  [SyntaxKind.TryStatement, "try"],
  [SyntaxKind.ThrowStatement, "throw"],
  [SyntaxKind.ForStatement, "loop"],
  [SyntaxKind.ForInStatement, "loop"],
  [SyntaxKind.ForOfStatement, "loop"],
  [SyntaxKind.WhileStatement, "loop"],
  [SyntaxKind.DoStatement, "loop"],
  [SyntaxKind.AsyncKeyword, "async"],
  [SyntaxKind.AwaitExpression, "await"],
])

function checkBanned(sf: SourceFile): void {
  for (const n of sf.getDescendants()) {
    const what = BANNED_KINDS.get(n.getKind())
    if (what) fail("LOOM106", n, `banned construct: ${what}`)
    if (Node.isVariableDeclarationList(n) && !n.getDeclarationKind().startsWith("const")) {
      fail("LOOM106", n, `banned construct: ${n.getDeclarationKind()}`)
    }
    if (Node.isCallExpression(n) && /(^|\.)use[A-Z]\w*$/.test(n.getExpression().getText())) {
      fail("LOOM106", n, `banned construct: hook call ${n.getExpression().getText()}`)
    }
  }
}

function resolveRefIn(sf: SourceFile, tag: string): { ref: string; name: string } | undefined {
  for (const imp of sf.getImportDeclarations()) {
    if (!imp.getModuleSpecifierValue().startsWith(".")) continue
    for (const spec of imp.getNamedImports()) {
      if ((spec.getAliasNode()?.getText() ?? spec.getName()) !== tag) continue
      const target = imp.getModuleSpecifierSourceFile()
      if (!target) return undefined
      try {
        return { ref: readLoom(target).id, name: spec.getName() }
      } catch {
        return undefined
      }
    }
  }
  return undefined
}

export interface FileResult {
  ir?: IRComponent
  positions?: Map<string, { line: number; col: number }>
  diagnostics: Diagnostic[]
}

export function extractFile(sf: SourceFile, source: string): FileResult {
  try {
    checkBanned(sf)
    const name = basename(sf.getFilePath()).replace(/\.loom\.tsx$/, "")
    const fn = sf.getFunctions().find((f) => f.isExported() && f.getName() === name)
    if (!fn) return fail("LOOM109", sf.getFunctions()[0] ?? sf, `file must export a function named "${name}"`)
    const loom = readLoom(sf)
    const params = extractParams(sf, fn)
    const helpers = collectHelpers(sf, name)

    const stmts = fn.getBodyOrThrow().asKindOrThrow(SyntaxKind.Block).getStatements()
    const ret = stmts[0]
    if (stmts.length !== 1 || !ret || !Node.isReturnStatement(ret)) {
      return fail("LOOM104", fn, "component body must be a single return statement")
    }
    const positions = new Map<string, { line: number; col: number }>()
    const root = buildRoot(ret.getExpression() ?? ret, {
      params: new Set(params.map((p) => p.name)),
      call: helpers.call,
      resolveRef: (tag) => resolveRefIn(sf, tag),
      positions,
    })

    const ir: IRComponent = {
      irVersion: 1,
      id: loom.id,
      name,
      version: loom.version,
      source,
      hash: createHash("sha256").update(sf.getFullText()).digest("hex").slice(0, 12),
      params,
      root,
    }
    const doc = componentDoc(fn)
    if (doc) ir.doc = doc
    return { ir, positions, diagnostics: [] }
  } catch (e) {
    if (!(e instanceof ExtractError)) throw e
    const { line, column } = e.node.getSourceFile().getLineAndColumnAtPos(e.node.getStart())
    return { diagnostics: [{ code: e.code, severity: "error", file: source, line, col: column, message: e.message }] }
  }
}

export interface ProjectResult {
  /** file name (`Name.ir.json`) → contents */
  outputs: Map<string, string>
  /** every source stem, including ones that failed */
  sources: Set<string>
  diagnostics: Diagnostic[]
}

export function extractProject(cwd: string, glob: string): ProjectResult {
  const project = loadProject(cwd, glob)
  const outputs = new Map<string, string>()
  const sources = new Set<string>()
  const diagnostics: Diagnostic[] = []
  const files = project.getSourceFiles().sort((a, b) => a.getFilePath().localeCompare(b.getFilePath()))
  for (const sf of files) {
    sources.add(basename(sf.getFilePath()).replace(/\.loom\.tsx$/, ""))
    const rel = relative(cwd, sf.getFilePath()).split("\\").join("/")
    const r = extractFile(sf, rel)
    diagnostics.push(...r.diagnostics)
    if (r.ir) outputs.set(`${r.ir.name}.ir.json`, writeJson(r.ir))
  }
  diagnostics.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.col - b.col)
  return { outputs, sources, diagnostics }
}

export async function runExtract(cwd: string): Promise<Diagnostic[]> {
  const config = await loadConfig(cwd)
  const { outputs, sources, diagnostics } = extractProject(cwd, config.components)
  const dir = resolve(cwd, config.out.ir)
  mkdirSync(dir, { recursive: true })
  for (const [file, text] of outputs) writeFileSync(resolve(dir, file), text)
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      if (f.endsWith(".ir.json") && !sources.has(f.slice(0, -".ir.json".length))) rmSync(resolve(dir, f))
    }
  }
  return diagnostics
}
