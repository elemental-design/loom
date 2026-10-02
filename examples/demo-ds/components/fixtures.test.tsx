import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { Button } from "./Button/Button.loom"
import { Badge } from "./Badge/Badge.loom"
import { Catalog } from "./Catalog/Catalog.loom"

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
  it("Catalog renders one img per item", () => {
    const items = [1, 2, 3].map((n) => ({ id: String(n), title: `t${n}`, image: "/placeholder.png" }))
    const html = renderToStaticMarkup(<Catalog heading="H" items={items} onLoadMore={() => {}} />)
    expect(html.match(/<img/g)).toHaveLength(3)
  })
})
