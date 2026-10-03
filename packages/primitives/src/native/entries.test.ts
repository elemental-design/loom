import { expect, test, vi } from "vitest"

// Acceptance 6: each entry exposes all nine components, verified by mocking
// the three host packages so no real dependency is imported.

const fakeHost = {
  View: () => null,
  Text: () => null,
  Image: () => null,
  Pressable: () => null,
}

const KEYS = [
  "HStack", "VStack", "ZStack", "Spacer", "Divider", "Text", "Image", "Icon", "Pressable",
]

test("rn entry", async () => {
  vi.doMock("react-native", () => fakeHost)
  const m = (await import("./rn.js")) as Record<string, unknown>
  for (const k of KEYS) expect(m[k], k).toBeTypeOf("function")
  expect(m.ThemeProvider, "ThemeProvider").toBeDefined()
  vi.doUnmock("react-native")
  vi.resetModules()
})

test("sketch entry", async () => {
  vi.doMock("react-sketchapp", () => fakeHost)
  const m = (await import("./sketch.js")) as Record<string, unknown>
  for (const k of KEYS) expect(m[k], k).toBeTypeOf("function")
  expect(m.ThemeProvider, "ThemeProvider").toBeDefined()
  vi.doUnmock("react-sketchapp")
  vi.resetModules()
})

test("figma entry", async () => {
  vi.doMock("react-figmaapp", () => fakeHost)
  const m = (await import("./figma.js")) as Record<string, unknown>
  for (const k of KEYS) expect(m[k], k).toBeTypeOf("function")
  expect(m.ThemeProvider, "ThemeProvider").toBeDefined()
  vi.doUnmock("react-figmaapp")
  vi.resetModules()
})
