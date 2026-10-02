import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Project } from "ts-morph"
import { describe, expect, test } from "vitest"
import { lintFiles, runLint } from "./lint.js"
import { vocabFromDef } from "./vocab.js"
import { loadTsModule } from "../config.js"
import type { TokensDef } from "../tokens/define.js"

const demo = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../examples/demo-ds")
const vocab = vocabFromDef(await loadTsModule<TokensDef>(resolve(demo, "loom.tokens.ts")))

type Src = { name?: string; id?: string; props?: string; body: string; imports?: string }
function lint(...srcs: Src[]) {
  const project = new Project({ useInMemoryFileSystem: true })
  const inputs = srcs.map((s, i) => {
    const name = s.name ?? String.fromCharCode(65 + i)
    const file = `${name}.loom.tsx`
    const text = `${s.imports ?? `import { Text, Icon, ZStack, VStack } from "@loom/primitives"`}
export interface ${name}Props { ${s.props ?? "n: number"} }
export const loom = { id: "${s.id ?? `cmp_${name.toLowerCase()}`}", version: "1.0.0" } as const
export function ${name}({ ${(s.props ?? "n: number").split(/;\s*(?![^{]*})/).map((p) => p.split(":")[0]!.trim()).join(", ")} }: ${name}Props) {
  return (
${s.body}
  )
}
`
    return { sf: project.createSourceFile(`/${file}`, text), file }
  })
  return lintFiles(inputs, vocab).map((d) => `${d.code}${d.severity === "warn" ? "w" : ""}@${d.line}`)
}
const line = (body: string, props?: string) => lint({ body, props })

describe("positive", () => {
  test("demo components lint clean", async () => {
    expect(await runLint(demo)).toEqual([])
  })
})

describe("negative", () => {
  test("202 raw color", () => expect(line(`<ZStack background="#fff" />`)).toEqual(["LOOM202@6"]))
  test("203 unknown color", () => expect(line(`<ZStack background="nope" />`)).toEqual(["LOOM203@6"]))
  test("203 via helper", () => {
    const r = lint({
      props: 'on: boolean',
      body: `<ZStack background={on ? "accent" : "nope"} />`,
    })
    expect(r).toEqual(["LOOM203@6"])
  })
  test("204 gap not in scale", () => expect(line(`<VStack gap={5} />`)).toEqual(["LOOM204@6"]))
  test("204 radius", () => expect(line(`<ZStack cornerRadius="huge" />`)).toEqual(["LOOM204@6"]))
  test("205 string param", () => expect(line(`<Text color={s} />`, "s: string")).toEqual(["LOOM205@6"]))
  test("205 loop var", () =>
    expect(
      line(`<VStack>{xs.map((item) => <VStack key={item.id} gap={item.n} />)}</VStack>`, "xs: { id: string; n: number }[]"),
    ).toEqual(["LOOM205@6"]))
  test("206 warn", () => expect(line(`<ZStack width={22} />`)).toEqual(["LOOM206w@6"]))
  test("207 compound", () =>
    expect(
      line(`<ZStack background={on ? (k === "a" ? "accent" : "danger") : "surface"} />`, `on: boolean; k: "a" | "b"`),
    ).toEqual(["LOOM207@6"]))
  test("208 duplicate id reported on second", () => {
    const r = lint({ body: `<Text />`, id: "cmp_x" }, { body: `<Text />`, id: "cmp_x" })
    expect(r).toEqual(["LOOM208@3"])
  })
  test("209 computed icon name", () =>
    expect(line(`<Icon name={"ar" + s} />`, "s: string")).toEqual(["LOOM209@6"]))
  test("209 icon param passthrough ok", () => expect(line(`<Icon name={i} />`, "i: IconName")).toEqual([]))
  test("201 bad import", () =>
    expect(
      lint({ body: `<Text />`, imports: `import { x } from "lodash"\nimport { Text } from "@loom/primitives"` }),
    ).toEqual(["LOOM201@1"]))
})
