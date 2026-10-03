import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { Button } from "./Button/Button.loom"
import { Button as ButtonFigma } from "./Button/Button.figma"
import { Badge } from "./Badge/Badge.loom"
import { Catalog } from "./Catalog/Catalog.loom"

import { createRequire } from "node:module"
import fs from "node:fs"
import path from "node:path"

import { ThemeProvider, createPrimitives } from "@loom/primitives/native"
import type { Host } from "../../../packages/primitives/src/native/host.js"

// The vendored react-sketchapp2 fork (../../react-sketchapp2) provides the
// Figma JSON backend. Its host components (View/Text -> sketch_view/sketch_text)
// have the Host shape @loom/primitives/native expects.
const requireFork = createRequire("../../../../react-sketchapp2/lib/figma.js")
const fork = requireFork("./index") as Host
const { renderToJSON, Page } = requireFork("./figma") as {
  renderToJSON: (element: React.ReactElement, options?: { name?: string, autoLayout?: boolean }) => unknown
  Page: React.ComponentType<{ name: string; children?: React.ReactNode }>
}

const { ZStack, Text } = createPrimitives(fork)

// Native theme values from generated/palette.json + loom.tokens.ts.
const theme = {
  color: {
    surface: "#fbfcfe",
    surfaceRaised: "#f3f4f6",
    textPrimary: "#232628",
    textMuted: "#5c5f60",
    separator: "#e1e2e4",
    accent: "#4c42e9",
    accentSoft: "#e2dfff",
    onAccent: "#ffffff",
    danger: "#b4271f",
    onDanger: "#ffffff",
  },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 } as Record<number, number>,
  radius: { sm: 6, md: 8, lg: 16, full: 999 },
  typography: {
    display: { fontSize: 34, lineHeight: 41, fontWeight: "700" },
    title: { fontSize: 28, lineHeight: 34, fontWeight: "600" },
    title2: { fontSize: 22, lineHeight: 28, fontWeight: "600" },
    headline: { fontSize: 17, lineHeight: 22, fontWeight: "600" },
    body: { fontSize: 17, lineHeight: 22, fontWeight: "400" },
    callout: { fontSize: 15, lineHeight: 20, fontWeight: "400" },
    caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
    caption2: { fontSize: 11, lineHeight: 13, fontWeight: "400" },
  },
}

describe("fixtures", () => {
  it("Button primary uses accent token", () => {
    expect(renderToStaticMarkup(<Button label="Go" />)).toContain("var(--loom-color-accent)")
  })
  it("Button renders svg only with icon", () => {
    expect(renderToStaticMarkup(<Button label="Go" icon="arrow-right" />)).toContain("<svg")
    expect(renderToStaticMarkup(<Button label="Go" />)).not.toContain("<svg")
  })
  it("Badge caps at 99+", () => {
    expect(renderToStaticMarkup(<Badge count={120} />)).toContain(">99+<")
  })
  it("Renders to Figma JSON", () => {
    const BadgeFigma = () => (
      <ZStack width={20} height={20} cornerRadius="full" background="danger">
        <Text typography="caption2" color="onDanger" align="center">
          Test
        </Text>
      </ZStack>
    )

    const figmaFile = renderToJSON(
      <ThemeProvider value={theme}>
        <Page name="Badge">
          <BadgeFigma />
        </Page>
      </ThemeProvider>,
      { name: "Badge", autoLayout: true },
    ) as { lastModified?: string }

    // buildFigmaDocument stamps Date.now() into lastModified; scrub it so the
    // comparison against the committed fixture is deterministic.
    if (figmaFile && typeof figmaFile === "object" && "lastModified" in figmaFile) {
      figmaFile.lastModified = "<lastModified>"
    }

    const fixturePath = path.join(__dirname, "__fixtures__", "badge.figma.json")
    if (process.env.UPDATE_FIXTURES) fs.writeFileSync(fixturePath, JSON.stringify(figmaFile, null, 2) + "\n")
    const expected = JSON.parse(fs.readFileSync(fixturePath, "utf8"))
    expect(figmaFile).toEqual(expected)
  })
  it("Renders to Figma JSON Button", () => {
    // const BadgeFigma = () => (
    //   <ZStack width={20} height={20} cornerRadius="full" background="danger">
    //     <Text typography="caption2" color="onDanger" align="center">
    //       Test
    //     </Text>
    //   </ZStack>
    // )

    const figmaFile = renderToJSON(
      <ThemeProvider value={theme}>
        <Page name="Badge">
          <ButtonFigma label="Go" />
        </Page>
      </ThemeProvider>,
      { name: "Badge",  },
    ) as { lastModified?: string }

    // buildFigmaDocument stamps Date.now() into lastModified; scrub it so the
    // comparison against the committed fixture is deterministic.
    if (figmaFile && typeof figmaFile === "object" && "lastModified" in figmaFile) {
      figmaFile.lastModified = "<lastModified>"
    }

    const fixturePath = path.join(__dirname, "__fixtures__", "button.figma.json")
    if (process.env.UPDATE_FIXTURES) fs.writeFileSync(fixturePath, JSON.stringify(figmaFile, null, 2) + "\n")
    const expected = JSON.parse(fs.readFileSync(fixturePath, "utf8"))
    expect(figmaFile).toEqual(expected)
  })
  it("Catalog renders one img per item", () => {
    const items = [1, 2, 3].map((n) => ({ id: String(n), title: `t${n}`, image: "/placeholder.png" }))
    const html = renderToStaticMarkup(<Catalog heading="H" items={items} onLoadMore={() => {}} />)
    expect(html.match(/<img/g)).toHaveLength(3)
  })
})
