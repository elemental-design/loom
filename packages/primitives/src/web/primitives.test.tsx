import { expect, test, vi } from "vitest"
import { renderToStaticMarkup as r } from "react-dom/server"
import { Divider, HStack, Icon, Image, Pressable, Spacer, Text, VStack, ZStack } from "../index.js"

test("HStack styles", () => {
  const m = r(<HStack gap={2} padding={[3, 4]} background="accent" cornerRadius="full" />)
  for (const s of [
    "display:flex", "flex-direction:row", "gap:var(--loom-space-2)",
    "padding:var(--loom-space-3) var(--loom-space-4)",
    "background:var(--loom-color-accent)", "border-radius:var(--loom-radius-full)",
  ]) expect(m).toContain(s)
  expect(r(<HStack padding={{ left: 2 }} />)).toContain("padding:0 0 0 var(--loom-space-2)")
})

test("fill rules", () => {
  const h = r(<HStack><VStack width="fill" /></HStack>)
  expect(h).toContain("flex:1 1 0")
  expect(h).toContain("min-width:0")
  expect(r(<VStack><HStack width="fill" /></VStack>)).toContain("align-self:stretch")
  expect(r(<VStack width="fill" />)).toContain("width:100%")
  expect(r(<VStack><HStack height="fill" /></VStack>)).toContain("flex:1 1 0")
  expect(r(<HStack><VStack height="fill" /></HStack>)).toContain("align-self:stretch")
  expect(r(<VStack height="fill" />)).toContain("height:100%")
  const n = r(<VStack width={44} />)
  expect(n).toContain("width:44px")
  expect(n).toContain("flex-shrink:0")
  expect(r(<VStack width="hugging" />)).toContain("width:fit-content")
})

test("role", () => {
  expect(r(<VStack role="header" />)).toContain('aria-level="2"')
  expect(r(<VStack role="text" />)).not.toContain("role=")
})

test("ZStack", () => {
  const m = r(<ZStack alignment="bottomEnd" />)
  expect(m).toContain('class="loom-zstack"')
  expect(m).toContain("display:grid")
  expect(m).toContain("align-items:end")
  expect(m).toContain("justify-items:end")
})

test("Text", () => {
  const m = r(<Text>hi</Text>)
  expect(m).toContain("loom-typography-body")
  expect(m).toContain("color:var(--loom-color-text-primary)")
  expect(m).not.toContain("-webkit-box")
  expect(r(<Text lines={2}>x</Text>)).toContain("-webkit-line-clamp:2")
  const h = r(<Text role="header">x</Text>)
  expect(h).toContain('role="heading"')
  expect(h).toContain('aria-level="2"')
  expect(r(<Text align="center" label="l">x</Text>)).toContain("text-align:center")
})

test("Divider and Spacer", () => {
  const h = r(<Divider inset={2} />)
  expect(h).toContain("height:1px")
  expect(h).toContain("margin-inline:var(--loom-space-2)")
  expect(h).toContain("var(--loom-color-separator)")
  const v = r(<Divider axis="vertical" inset={2} />)
  expect(v).toContain("width:1px")
  expect(v).toContain("margin-block:var(--loom-space-2)")
  expect(r(<Spacer />)).toContain("min-width:0")
  expect(r(<Spacer min={3} />)).toContain("min-height:var(--loom-space-3)")
})

test("Image", () => {
  expect(r(<Image src="a.png" />)).toContain('alt=""')
  expect(r(<Image src="a.png" label="pic" resizeMode="contain" />)).toContain("object-fit:contain")
  expect(r(<Image src="a.png" resizeMode="fill" cornerRadius="md" />)).toContain("overflow:hidden")
})

test("Icon", () => {
  expect(r(<Icon name="arrow-right" />)).toContain("<svg")
  const spy = vi.spyOn(console, "warn").mockImplementation(() => {})
  expect(r(<Icon name="no-such-icon" />)).toBe("")
  r(<Icon name="no-such-icon" />)
  expect(spy).toHaveBeenCalledTimes(1)
  spy.mockRestore()
})

test("Pressable", () => {
  const m = r(<Pressable disabled direction="vertical">x</Pressable>)
  expect(m).toContain('<button type="button" class="loom-pressable"')
  expect(m).toContain("disabled")
  expect(m).toContain("flex-direction:column")
  expect(m).not.toContain("role=")
})
