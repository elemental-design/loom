import { describe, expect, test } from "vitest"
import {
  alignStyle, boxStyle, colorOf, justifyStyle, paddingStyle, radiusOf, sizeStyle, spaceOf,
  stackStyle, typographyOf, zAlignParts,
} from "./style.js"
import type { Theme } from "./theme.js"

const theme: Theme = {
  color: { accent: "#5B5BD6", separator: "#E0E0E0" },
  space: { 2: 8, 3: 12, 4: 16 },
  radius: { full: 999 },
  typography: { body: { fontSize: 14 } },
}

test("lookup helpers", () => {
  expect(colorOf(theme, "accent")).toBe("#5B5BD6")
  expect(colorOf(theme, "transparent")).toBe("transparent")
  expect(() => colorOf(theme, "nope" as never)).toThrow("LOOM300")
  expect(spaceOf(theme, 2)).toBe(8)
  expect(() => spaceOf(theme, 7 as never)).toThrow("LOOM300")
  expect(radiusOf(theme, "full")).toBe(999)
  expect(() => radiusOf(theme, "xl" as never)).toThrow("LOOM300")
  expect(typographyOf(theme, "body")).toEqual({ fontSize: 14 })
  expect(() => typographyOf(theme, "display")).toThrow("LOOM300")
})

test("padding forms", () => {
  expect(paddingStyle(theme, 2)).toEqual({ padding: 8 })
  expect(paddingStyle(theme, [3, 4])).toEqual({ paddingVertical: 12, paddingHorizontal: 16 })
  expect(paddingStyle(theme, { left: 2 })).toEqual({
    paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 8,
  })
  expect(paddingStyle(theme, {})).toEqual({
    paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
  })
})

describe("sizeStyle across parent axes", () => {
  test("number", () => {
    expect(sizeStyle(44, "width", "row")).toEqual({ width: 44, flexShrink: 0 })
    expect(sizeStyle(44, "height", "column")).toEqual({ height: 44, flexShrink: 0 })
    expect(sizeStyle(44, "width", "z")).toEqual({ width: 44, flexShrink: 0 })
    expect(sizeStyle(44, "height", "none")).toEqual({ height: 44, flexShrink: 0 })
  })
  test("percent", () => {
    expect(sizeStyle("50%", "width", "none")).toEqual({ width: "50%" })
    expect(sizeStyle("50%", "height", "z")).toEqual({ height: "50%" })
  })
  test("hugging", () => {
    expect(sizeStyle("hugging", "width", "column")).toEqual({
      flexGrow: 0, flexShrink: 0, alignSelf: "flex-start",
    })
    expect(sizeStyle("hugging", "height", "row")).toEqual({
      flexGrow: 0, flexShrink: 0, alignSelf: "flex-start",
    })
    expect(sizeStyle("hugging", "height", "column")).toEqual({
      flexGrow: 0, flexShrink: 0,
    })
    expect(sizeStyle("hugging", "width", "row")).toEqual({
      flexGrow: 0, flexShrink: 0,
    })
    expect(sizeStyle("hugging", "width", "z")).toEqual({
      flexGrow: 0, flexShrink: 0,
    })
    expect(sizeStyle("hugging", "height", "none")).toEqual({
      flexGrow: 0, flexShrink: 0,
    })
  })
  test("fill main", () => {
    expect(sizeStyle("fill", "width", "row")).toEqual({
      flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0,
    })
    expect(sizeStyle("fill", "height", "column")).toEqual({
      flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0,
    })
  })
  test("fill cross", () => {
    expect(sizeStyle("fill", "width", "column")).toEqual({ alignSelf: "stretch" })
    expect(sizeStyle("fill", "height", "row")).toEqual({ alignSelf: "stretch" })
  })
  test("fill z/none", () => {
    expect(sizeStyle("fill", "width", "z")).toEqual({ width: "100%" })
    expect(sizeStyle("fill", "height", "none")).toEqual({ height: "100%" })
  })
})

test("align/justify", () => {
  expect(alignStyle("start")).toEqual({ alignItems: "flex-start" })
  expect(alignStyle("center")).toEqual({ alignItems: "center" })
  expect(alignStyle("end")).toEqual({ alignItems: "flex-end" })
  expect(alignStyle("stretch")).toEqual({ alignItems: "stretch" })
  expect(justifyStyle("start")).toEqual({ justifyContent: "flex-start" })
  expect(justifyStyle("center")).toEqual({ justifyContent: "center" })
  expect(justifyStyle("end")).toEqual({ justifyContent: "flex-end" })
  expect(justifyStyle("spaceBetween")).toEqual({ justifyContent: "space-between" })
})

test("zAlignParts", () => {
  const cases = {
    topStart: ["flex-start", "flex-start"], top: ["flex-start", "center"], topEnd: ["flex-start", "flex-end"],
    start: ["center", "flex-start"], center: ["center", "center"], end: ["center", "flex-end"],
    bottomStart: ["flex-end", "flex-start"], bottom: ["flex-end", "center"], bottomEnd: ["flex-end", "flex-end"],
  } as const
  for (const [k, [v, h]] of Object.entries(cases)) {
    expect(zAlignParts(k as keyof typeof cases).v).toEqual({ alignItems: v })
    expect(zAlignParts(k as keyof typeof cases).h).toEqual({ justifyContent: h })
  }
})

test("box + stack", () => {
  expect(boxStyle(theme, { background: "accent", cornerRadius: "full", clip: true })).toEqual({
    backgroundColor: "#5B5BD6", borderRadius: 999, overflow: "hidden",
  })
  expect(
    stackStyle(theme, { gap: 2, padding: [3, 4], background: "accent" }, "row", "none"),
  ).toEqual({
    flexDirection: "row",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "stretch",
    justifyContent: "flex-start",
    backgroundColor: "#5B5BD6",
  })
})
