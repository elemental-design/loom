import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Project } from "ts-morph"
import { describe, expect, test } from "vitest"
import { extractFile, extractProject } from "./extract.js"

const demo = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../examples/demo-ds")
const glob = "./components/**/*.loom.tsx"

function run(name: string, text: string) {
  const project = new Project({ useInMemoryFileSystem: true })
  const sf = project.createSourceFile(`/${name}.loom.tsx`, text)
  return extractFile(sf, `${name}.loom.tsx`)
}

const header = `import { Text, ZStack } from "@loom/primitives"\n`
const loom = `export const loom = { id: "cmp_a", version: "1.0.0" } as const\n`
const comp = (body: string, extra = "") =>
  `${header}export interface AProps { n: number; on?: boolean }\n${loom}${extra}\nexport function A({ n, on }: AProps) {\n${body}\n}\n`

describe("golden", () => {
  const { outputs, diagnostics } = extractProject(demo, glob)
  test("no diagnostics", () => expect(diagnostics).toEqual([]))
  for (const name of ["Badge", "Button", "Catalog"]) {
    test(`${name} matches committed IR`, () => {
      const committed = readFileSync(resolve(demo, `.loom/${name}.ir.json`), "utf8")
      expect(outputs.get(`${name}.ir.json`)).toBe(committed)
    })
  }
  test("deterministic", () => {
    expect([...extractProject(demo, glob).outputs]).toEqual([...outputs])
  })
  test("Badge equals spec example (color is a cond; see OPEN_QUESTIONS)", () => {
    const ir = JSON.parse(outputs.get("Badge.ir.json")!)
    delete ir.hash
    delete ir.doc
    expect(ir).toEqual({
      id: "cmp_badge", irVersion: 1, name: "Badge", version: "1.0.0",
      source: "components/Badge/Badge.loom.tsx",
      params: [
        { name: "count", required: true, type: "number" },
        { default: "danger", name: "tone", required: false, type: "enum", values: ["accent", "danger"] },
      ],
      root: {
        children: [
          { children: [], id: "n0.0", kind: "primitive", type: "Text",
            props: {
              color: { cond: { l: { param: "tone" }, op: "===", r: { lit: "danger" } }, else: { lit: "onAccent" }, then: { lit: "onDanger" } },
              content: { cond: { l: { param: "count" }, op: ">", r: { lit: 99 } }, else: { arg: { param: "count" }, call: "String" }, then: { lit: "99+" } },
              typography: { lit: "caption2" },
            } },
        ],
        id: "n0", kind: "primitive", type: "ZStack",
        props: {
          background: { key: { param: "tone" }, lookup: { accent: { lit: "accent" }, danger: { lit: "danger" } } },
          cornerRadius: { lit: "full" }, height: { lit: 20 }, width: { lit: 20 },
        },
      },
    })
  })
  test("Button specifics", () => {
    const ir = JSON.parse(outputs.get("Button.ir.json")!)
    const padding = ir.root.props.padding
    expect(padding).toEqual({ lookup: { sm: { lit: 2 }, md: { lit: 3 }, lg: { lit: 4 } }, key: { param: "size" } })
    expect(ir.root.children[0].when).toEqual({ param: "icon" })
    expect(ir.root.children[0].props.color.cond).toBeDefined()
    expect(ir.params.find((p: any) => p.name === "size").default).toBe("md")
  })
  test("Catalog repeat and component ref", () => {
    const ir = JSON.parse(outputs.get("Catalog.ir.json")!)
    const list = ir.root.children[2]
    expect(list.children[0]).toMatchObject({ kind: "repeat", id: "n0.2.0", as: "item", key: { get: { var: "item" }, field: "id" } })
    expect(list.children[0].children[0].id).toBe("n0.2.0.0")
    expect(ir.root.children[0].children[1]).toMatchObject({ kind: "component", ref: "cmp_badge", name: "Badge" })
  })
})

describe("positive", () => {
  test("ternary and && produce when", () => {
    const r = run("A", comp(`return <ZStack>{on && <Text>a</Text>}{on ? <Text>b</Text> : <Text>c</Text>}</ZStack>`))
    expect(r.diagnostics).toEqual([])
    const kids = (r.ir!.root as any).children
    expect(kids.map((k: any) => [k.id, k.when])).toEqual([
      ["n0.0", { param: "on" }],
      ["n0.1", { param: "on" }],
      ["n0.2", { not: { param: "on" } }],
    ])
  })
  test("text folding", () => {
    const r = run("A", comp(`return <Text>n is {n} ok</Text>`))
    expect((r.ir!.root as any).props.content).toEqual({
      op: "+",
      l: { op: "+", l: { lit: "n is " }, r: { param: "n" } },
      r: { lit: " ok" },
    })
  })
})

describe("negative", () => {
  const code = (r: ReturnType<typeof run>) => r.diagnostics.map((d) => d.code)
  test("LOOM102 spread", () => expect(code(run("A", comp(`return <Text {...x} />`)))).toEqual(["LOOM102"]))
  test("LOOM103 fragment", () => expect(code(run("A", comp(`return <></>`)))).toEqual(["LOOM103"]))
  test("LOOM104 template literal", () =>
    expect(code(run("A", comp("return <Text>{`a${n}`}</Text>")))).toEqual(["LOOM104"]))
  test("LOOM104 arithmetic", () => expect(code(run("A", comp(`return <Text>{n * 2}</Text>`)))).toEqual(["LOOM104"]))
  test("LOOM105 block helper", () =>
    expect(code(run("A", comp(`return <Text>{h(n)}</Text>`, `const h = (x: number) => { return x }\n`)))).toEqual(["LOOM105"]))
  test("LOOM105 recursive helper", () =>
    expect(code(run("A", comp(`return <Text>{h(n)}</Text>`, `const h = (x: number): number => h(x)\n`)))).toEqual(["LOOM105"]))
  test("LOOM106 hook", () =>
    expect(code(run("A", comp(`const s = useState(0)\nreturn <Text>a</Text>`)))).toEqual(["LOOM106"]))
  test("LOOM107 map without key", () => {
    const src = `${header}export interface AProps { xs: { id: string }[] }\n${loom}export function A({ xs }: AProps) { return <ZStack>{xs.map((x) => <Text>a</Text>)}</ZStack> }\n`
    expect(code(run("A", src))).toEqual(["LOOM107"])
  })
  test("LOOM108 no loom", () =>
    expect(code(run("A", `${header}export function A() { return <Text>a</Text> }\n`))).toEqual(["LOOM108"]))
  test("LOOM109 name mismatch", () =>
    expect(code(run("A", `${header}${loom}export function B() { return <Text>a</Text> }\n`))).toEqual(["LOOM109"]))
  test("LOOM110 unknown tag", () => expect(code(run("A", comp(`return <div />`)))).toEqual(["LOOM110"]))
  test("LOOM101 extends", () => {
    const src = `${header}interface Y { a: string }\nexport interface AProps extends Y { n: number }\n${loom}export function A({ n }: AProps) { return <Text>a</Text> }\n`
    expect(code(run("A", src))).toEqual(["LOOM101"])
  })
  test("LOOM101 Date", () => {
    const src = `${header}export interface AProps { d: Date }\n${loom}export function A({ d }: AProps) { return <Text>a</Text> }\n`
    expect(code(run("A", src))).toEqual(["LOOM101"])
  })
  test("diagnostic format", () => {
    const d = run("A", comp(`return <Text {...x} />`)).diagnostics[0]!
    expect(d).toMatchObject({ file: "A.loom.tsx", line: 6, severity: "error" })
  })
})
