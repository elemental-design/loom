import { createElement } from "react"
import type { ReactNode } from "react"
import { expect, test, vi } from "vitest"
import { renderToStaticMarkup as r } from "react-dom/server"
import { createPrimitives } from "./create.js"
import type { Host } from "./host.js"
import { ThemeProvider } from "./theme.js"

// A fake host whose elements are string-tagged custom elements. The style
// object is serialized into `data-style`; selected props are mirrored into
// `data-*` attributes so assertions can inspect the rendered tree.
let seq = 0

const DATA: Record<string, string> = {
  numberOfLines: "numberoflines",
  accessibilityRole: "accessibilityrole",
  accessibilityLabel: "accessibilitylabel",
  onPress: "onpress",
  disabled: "disabled",
  source: "source",
}

const node = (tag: string, props: Record<string, unknown>, children?: ReactNode) => {
  const attrs: Record<string, unknown> = {
    "data-tag": tag,
    "data-style": JSON.stringify(
      typeof props.style === "function" ? props.style({ pressed: false }) : props.style ?? {},
    ),
  }
  for (const [k, v] of Object.entries(props)) {
    const d = DATA[k]
    if (d === undefined || v === undefined) continue
    attrs[`data-${d}`] = typeof v === "function" ? "bound" : JSON.stringify(v)
  }
  return createElement(`loom-${tag}-${seq++}`, attrs, children)
}

const fakeHost: Host = {
  View: (props) => node("view", props, props.children),
  Text: (props) => node("text", props, props.children),
  Image: (props) => node("image", props),
  Pressable: (props) => node("pressable", props, props.children),
}

const noPressableHost: Host = { View: fakeHost.View, Text: fakeHost.Text, Image: fakeHost.Image }

const theme = {
  color: { accent: "#5B5BD6", separator: "#E0E0E0", textPrimary: "#111111" },
  space: { 2: 8, 3: 12, 4: 16 },
  radius: { full: 999 },
  typography: { body: { fontSize: 14 }, caption2: { fontSize: 11 } },
}

const parse = (json: string): Record<string, unknown> => JSON.parse(json.replaceAll("&quot;", '"'))

// Styles of every host view in the markup, in render order.
const styles = (markup: string): Record<string, unknown>[] =>
  (markup.match(/data-style="([^"]*)"/g) ?? []).map((x) => parse(x.slice(12, -1)))

const styleOf = (markup: string, tag: string): Record<string, unknown> => {
  const m = markup.match(new RegExp(`data-tag="${tag}" data-style="([^"]*)"`))
  if (!m?.[1]) throw new Error(`no ${tag} in ${markup}`)
  return parse(m[1])
}

const attrsOf = (markup: string, tag: string): Record<string, unknown> => {
  const m = markup.match(new RegExp(`<loom-${tag}-\\d+ ([^>]*)>`))
  if (!m?.[1]) throw new Error(`no ${tag} in ${markup}`)
  const attrs: Record<string, unknown> = {}
  for (const g of m[1].matchAll(/data-([a-zA-Z]+)="([^"]*)"/g)) {
    const k = g[1]
    const raw = g[2]
    if (k === undefined || raw === undefined || k === "tag" || k === "style") continue
    attrs[k] = raw === "bound" ? raw : parse(raw)
  }
  return attrs
}

const P = createPrimitives(fakeHost)
const Q = createPrimitives(noPressableHost)

const renderP = (el: ReactNode): string => r(<ThemeProvider value={theme}>{el}</ThemeProvider>)

test("HStack resolves theme values", () => {
  const m = renderP(<P.HStack gap={2} padding={[3, 4]} background="accent" />)
  const s = styleOf(m, "view")
  expect(s.flexDirection).toBe("row")
  expect(s.gap).toBe(8)
  expect(s.paddingVertical).toBe(12)
  expect(s.paddingHorizontal).toBe(16)
  expect(s.backgroundColor).toBe("#5B5BD6")
})

test("unknown key throws LOOM300", () => {
  expect(() => renderP(<P.HStack background="nope" />)).toThrow("LOOM300")
  expect(() => renderP(<P.HStack gap={7} />)).toThrow("LOOM300")
  expect(() => renderP(<P.HStack cornerRadius="xl" />)).toThrow("LOOM300")
  expect(() => renderP(<P.Text typography="display">x</P.Text>)).toThrow("LOOM300")
})

test("no provider throws LOOM301", () => {
  expect(() => r(<P.HStack />)).toThrow("LOOM301")
})

test("ZStack requires numeric size and maps 9 alignments", () => {
  expect(() => renderP(<P.ZStack><P.Text>x</P.Text></P.ZStack>)).toThrow("LOOM302")
  expect(() => renderP(<P.ZStack width={20}><P.Text>x</P.Text></P.ZStack>)).toThrow("LOOM302")
  const cases: Record<string, [string, string]> = {
    topStart: ["flex-start", "flex-start"], top: ["flex-start", "center"], topEnd: ["flex-start", "flex-end"],
    start: ["center", "flex-start"], center: ["center", "center"], end: ["center", "flex-end"],
    bottomStart: ["flex-end", "flex-start"], bottom: ["flex-end", "center"], bottomEnd: ["flex-end", "flex-end"],
  }
  for (const [a, [v, h]] of Object.entries(cases)) {
    const m = renderP(
      <P.ZStack width={20} height={20} alignment={a as never}><P.Text>x</P.Text></P.ZStack>,
    )
    const wrapper = styles(m).find((s) => s.position === "absolute")
    expect(wrapper).toMatchObject({ alignItems: v, justifyContent: h })
  }
  const m = renderP(<P.ZStack width={20} height={20}><P.Text>x</P.Text></P.ZStack>)
  expect(styles(m)[0]).toMatchObject({ position: "relative", width: 20, height: 20 })
})

test("Spacer and Divider", () => {
  const s = styleOf(renderP(<P.Spacer min={3} />), "view")
  expect(s.flexGrow).toBe(1)
  expect(s.minWidth).toBe(12)
  expect(styleOf(renderP(<P.Spacer />), "view").minWidth).toBe(0)
  const d = styleOf(renderP(<P.Divider inset={2} />), "view")
  expect(d.height).toBe(1)
  expect(d.alignSelf).toBe("stretch")
  expect(d.backgroundColor).toBe("#E0E0E0")
  const v = styleOf(renderP(<P.Divider axis="vertical" color="accent" />), "view")
  expect(v.width).toBe(1)
  expect(v.backgroundColor).toBe("#5B5BD6")
})

test("Text, Image, Icon", () => {
  const m = renderP(<P.Text typography="caption2" color="accent" lines={2} align="center" role="header" label="l">x</P.Text>)
  const t = styleOf(m, "text")
  expect(t.fontSize).toBe(11)
  expect(t.color).toBe("#5B5BD6")
  expect(t.textAlign).toBe("center")
  const ta = attrsOf(m, "text")
  expect(ta.numberoflines).toBe(2)
  expect(ta.accessibilityrole).toBe("header")
  expect(ta.accessibilitylabel).toBe("l")
  const img = styleOf(renderP(<P.Image src="a.png" width={40} height="50%" cornerRadius="full" label="pic" resizeMode="contain" />), "image")
  expect(img.width).toBe(40)
  expect(img.height).toBe("50%")
  expect(img.borderRadius).toBe(999)
  const ia = attrsOf(renderP(<P.Image src="a.png" label="pic" resizeMode="contain" />), "image")
  expect(ia.source).toEqual({ uri: "a.png" })
  expect(ia.accessibilitylabel).toBe("pic")
  const icon = styleOf(renderP(<P.Icon name="x" size={24} color="accent" />), "view")
  expect(icon.width).toBe(24)
  expect(icon.height).toBe(24)
  expect(icon.backgroundColor).toBe("#5B5BD6")
})

test("Icon warns once per name", () => {
  const spy = vi.spyOn(console, "warn").mockImplementation(() => {})
  renderP(<P.Icon name="warn-test" />)
  renderP(<P.Icon name="warn-test" />)
  expect(spy).toHaveBeenCalledTimes(1)
  expect(spy.mock.calls[0]?.[0]).toContain("LOOM303")
  expect(spy.mock.calls[0]?.[0]).toContain("warn-test")
  spy.mockRestore()
})

test("Pressable", () => {
  const m = renderP(<P.Pressable onPress={() => {}} disabled direction="vertical">x</P.Pressable>)
  const s = styleOf(m, "pressable")
  expect(s.opacity).toBe(0.5)
  expect(s.flexDirection).toBe("column")
  const pa = attrsOf(m, "pressable")
  expect(pa.accessibilityrole).toBe("button")
  expect(pa.onpress).toBe("bound")
  expect(pa.disabled).toBe(true)
})

test("host without Pressable renders a View; onPress inert", () => {
  const m = renderP(<Q.Pressable onPress={() => { throw new Error("should not fire") }}>x</Q.Pressable>)
  expect(m).toContain('data-tag="view"')
  const va = attrsOf(m, "view")
  expect(va.accessibilityrole).toBe("button")
  expect(va.onpress).toBeUndefined()
})

test("fill rules through components", () => {
  const m = renderP(
    <P.HStack>
      <P.VStack width="fill" />
      <P.VStack height="fill" />
      <P.VStack width={44} />
      <P.VStack width="50%" />
      <P.VStack width="hugging" />
    </P.HStack>,
  )
  const views = styles(m)
  expect(views[1]).toMatchObject({ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 })
  expect(views[2]).toMatchObject({ alignSelf: "stretch" })
  expect(views[3]).toMatchObject({ width: 44, flexShrink: 0 })
  expect(views[4]).toMatchObject({ width: "50%" })
  expect(views[5]).toMatchObject({ flexGrow: 0, flexShrink: 0 })
})
