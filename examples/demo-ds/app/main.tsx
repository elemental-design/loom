import { createRoot } from "react-dom/client"
import "../generated/tokens.css"
import "@loom/primitives/primitives.css"
import { Button } from "../components/Button/Button.loom"
import { compositions as buttonCompositions } from "../components/Button/Button.compositions"
import { Badge } from "../components/Badge/Badge.loom"
import { compositions as badgeCompositions } from "../components/Badge/Badge.compositions"
import { Catalog } from "../components/Catalog/Catalog.loom"
import { compositions as catalogCompositions } from "../components/Catalog/Catalog.compositions"

const sections = [
  { name: "Button", items: buttonCompositions.map((c) => ({ name: c.name, node: <Button {...c.props} /> })) },
  { name: "Badge", items: badgeCompositions.map((c) => ({ name: c.name, node: <Badge {...c.props} /> })) },
  { name: "Catalog", items: catalogCompositions.map((c) => ({ name: c.name, node: <Catalog {...c.props} /> })) },
]

const App = () => (
  <main style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
    {sections.map((s) => (
      <section key={s.name}>
        <h2>{s.name}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {s.items.map((i) => (
            <figure key={i.name} style={{ margin: 0 }}>
              <figcaption style={{ fontSize: 12, marginBottom: 8 }}>{i.name}</figcaption>
              {i.node}
            </figure>
          ))}
        </div>
      </section>
    ))}
  </main>
)

createRoot(document.getElementById("root")!).render(<App />)
