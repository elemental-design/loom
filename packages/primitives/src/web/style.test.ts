import { describe, expect, test } from "vitest"
import {
  alignStyle, colorVar, justifyStyle, kebab, paddingStyle, radiusVar, sizeStyle, spacingVar, zAlignStyle,
} from "./style.js"

test("vars", () => {
  expect(kebab("textPrimary")).toBe("text-primary")
  expect(colorVar("surfaceRaised")).toBe("var(--loom-color-surface-raised)")
  expect(colorVar("transparent")).toBe("transparent")
  expect(spacingVar(2)).toBe("var(--loom-space-2)")
  expect(radiusVar("full")).toBe("var(--loom-radius-full)")
})

test("padding", () => {
  expect(paddingStyle(2)).toEqual({ padding: "var(--loom-space-2)" })
  expect(paddingStyle([3, 4])).toEqual({ padding: "var(--loom-space-3) var(--loom-space-4)" })
  expect(paddingStyle({ left: 2 })).toEqual({ padding: "0 0 0 var(--loom-space-2)" })
  expect(paddingStyle({ top: 1, right: 2, bottom: 3, left: 4 }).padding).toBe(
    "var(--loom-space-1) var(--loom-space-2) var(--loom-space-3) var(--loom-space-4)",
  )
})

describe("sizeStyle", () => {
  test("undefined", () => expect(sizeStyle(undefined, "width", "row")).toEqual({}))
  test("number", () => expect(sizeStyle(44, "width", "row")).toEqual({ width: "44px", flexShrink: 0 }))
  test("percent", () => expect(sizeStyle("50%", "height", "none")).toEqual({ height: "50%" }))
  test("hugging", () =>
    expect(sizeStyle("hugging", "height", "row")).toEqual({ height: "fit-content", flex: "0 0 auto" }))
  test("fill main", () => {
    expect(sizeStyle("fill", "width", "row")).toEqual({ flex: "1 1 0", minWidth: 0 })
    expect(sizeStyle("fill", "height", "column")).toEqual({ flex: "1 1 0", minHeight: 0 })
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

test("zAlignStyle", () => {
  const cases = {
    topStart: ["start", "start"], top: ["start", "center"], topEnd: ["start", "end"],
    start: ["center", "start"], center: ["center", "center"], end: ["center", "end"],
    bottomStart: ["end", "start"], bottom: ["end", "center"], bottomEnd: ["end", "end"],
  } as const
  for (const [k, [a, j]] of Object.entries(cases)) {
    expect(zAlignStyle(k as keyof typeof cases)).toEqual({ alignItems: a, justifyItems: j })
  }
})
