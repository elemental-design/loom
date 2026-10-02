import { Command } from "commander"
import { buildTokens } from "./tokens/build.js"
import { formatDiagnostic } from "./diagnostics.js"
import { runExtract } from "./extract/extract.js"

const program = new Command()

program
  .name("loom")
  .description("Loom compiler: tokens, extraction, lint, codegen")
  .version("0.0.0")

const notImplemented = () => {
  console.error("not implemented")
  process.exit(1)
}

program
  .command("tokens build")
  .description("build tokens from loom.tokens.ts")
  .action(async () => {
    const diagnostics = await buildTokens(process.cwd())
    for (const d of diagnostics) console.error(formatDiagnostic(d))
    if (diagnostics.some((d) => d.severity === "error")) process.exit(1)
  })

program
  .command("extract")
  .description("extract components to IR")
  .action(async () => {
    const diagnostics = await runExtract(process.cwd())
    for (const d of diagnostics) console.error(formatDiagnostic(d))
    if (diagnostics.some((d) => d.severity === "error")) process.exit(1)
  })

program.command("lint").description("run lint rules").action(notImplemented)

program
  .command("gen")
  .description("codegen")
  .command("web")
  .option("--check", "compare to disk, write nothing, fail on drift")
  .description("generate standalone web components from IR")
  .action(notImplemented)

program.parseAsync(process.argv)
