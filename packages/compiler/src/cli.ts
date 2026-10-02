import { Command } from "commander"

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
  .action(notImplemented)

program.command("extract").description("extract components to IR").action(notImplemented)

program.command("lint").description("run lint rules").action(notImplemented)

program
  .command("gen")
  .description("codegen")
  .command("web")
  .option("--check", "compare to disk, write nothing, fail on drift")
  .description("generate standalone web components from IR")
  .action(notImplemented)

program.parseAsync(process.argv)
