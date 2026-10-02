# Reading Lona's Actual Specs: Verdict + Adjustments

Good context — it validates several decisions, hands us four concrete steals, and clarifies exactly one thing worth cutting. Short answer: **your narrowed scope (shadcn, Figma tokens/components/styleguide, SwiftUI, Compose) is right. The AI layer should be cut from the MVP — but not deleted, just deferred behind two cheap structural choices the Lona docs accidentally justify.**

---

## 1. What the Lona Docs Validate (no action needed)

- **The JSON merge problem.** Their own doc admits JSON "isn't easily mergeable or human-editable." Our TSX-first authoring sidesteps this entirely — TSX is already mergeable, reviewable, and typed. The IR stays JSON because *machines* consume it; humans never hand-edit it.
- **Logic-as-AST is a dead end.** Their `AssignExpr`/`IfExpr` tree needs ~20 lines of JSON to express "if body is present, set text and visibility." That verbosity is exactly why we chose pure TS helper functions — our extraction approach gets the same determinism with none of the DSL. The Lona docs are the strongest argument *for* our decision.
- **`visible: false` on nodes** — our `when:` conditions already cover this, plus our extractors handle it uniformly.

## 2. What to Steal (four concrete items)

### 2.1 The `id` / `name` / `comment` triple for tokens

Lona's color spec separates code-friendly `id`, human `name`, and usage-context `comment`. We had names only. Adopt all three — and this is the first AI-deferral payoff: **the `comment` field is precisely the context an AI needs later** ("use for elevated card backgrounds only, never text"). Filling these in now costs nothing; retrofitting usage context into 60 tokens later is the task nobody does.

### 2.2 Namespaced tool metadata (`private` + `com.lonastudioapp`)

Their rule — each tool owns a prefix, must never touch others' keys — is the right governance for our provenance layer. Formalize it: every projection writes provenance under its own namespace (`loom.figma.nodeId`, `loom.sketch.layerId`), reads nothing else's, and foreign keys pass through untouched. This makes the react-figmaapp renderer and any future Penpot plugin independently coexistable on the same document.

### 2.3 `devices` → viewport declarations on compositions

We dropped multi-viewport preview in the MVP cut. Lona's `devices` array (with `heightMode: At Least | Exactly`, per-device params and background) is the cheap version worth keeping — renamed **`viewports`** on compositions:

```yaml
viewports:
  - { name: phone,  width: 375, heightMode: atLeast }
  - { name: tablet, width: 768, heightMode: exactly }
```

Three consumers, one declaration: Storybook/viewConfig previews, snapshot test matrix, and — directly relevant to your scope — **the Figma styleguide generator**, which renders the variant × viewport matrix as pages of frames.

### 2.4 Per-node accessibility

Lona puts `accessibilityRole`, `accessibilityType: element | container`, and `accessibilityElements` ordering on individual layers — more granular than our component-level `a11y:` block. Adopt per-node `role` and `label` props on primitives (maps to SwiftUI `.accessibilityRole`, Compose `semantics`, RN `accessibilityRole`), and treat the container-ordering pattern as a known good idea for later.

## 3. What to Reject (and why it matters for your scope)

The Material palette dump — 200 raw ramp colors with ids like `deeporangea700` — is the anti-pattern our HCT design avoids. Two observations worth internalizing:

- **Ramps are generated artifacts, not source.** Keep the HCT palette generator from the previous plan, but inverted: seeds + semantic roles are source; a Material-style ramp (`accent50…accent900`) is *emitted* for Tailwind (`bg-accent-500`) and Figma swatch pages. Lona shipped the ramp because they had no generator; we emit the ramp because we do.
- **No semantic layer = unusable at scale.** Nothing in that file says what to pair with what. The semantic token layer (`onAccent`, `surfaceRaised`) plus contrast-validated pairing is the actual product.

## 4. Compose Mapping (new scope item — cheap, since the model fits)

Jetpack Compose slots into the same architecture as the fourth primitives implementation — no format changes needed:

| Loom | Compose | Notes |
| --- | --- | --- |
| HStack / VStack | `Row` / `Column` | `gap` → `Arrangement.spacedBy` |
| ZStack | `Box` | alignment maps directly |
| width/height `fill`/`hugging` | `Modifier.fillMaxWidth()` / `wrapContentWidth()` | |
| `Pressable` | `Surface(onClick = ...)` or `Button` | state variants → interaction states |
| Text + typography token | `Text(style = LoomTheme.typography.x)` | |
| Tokens | Kotlin object or `CompositionLocal` theme | emit alongside MaterialTheme color mapping |
| CVA-style variants | enum params + `when` | closest analogue to SwiftUI |
| `child` param | slot lambdas | composable-trailing-lambda — maps beautifully |

Resolution question to settle in Phase 1: Loom native targets ship via `react-native` field resolution, but Compose/SwiftUI need **codegen from the IR**. That's fine — it's the same generator architecture as the shadcn target, and it's why we kept the IR extraction honest about layout semantics.

## 5. Scope Recommendation

**Keep:** primitives + TSX authoring + IR extraction · shadcn/Tailwind codegen with emitted ramps · react-figmaapp for tokens, components, and styleguide generation (variant × viewport matrix, swatch pages, typography scale) · SwiftUI + Compose as IR-codegen targets.

**Cut from MVP, order restored:**

1. ~~AI patch format~~ → replaced by *conventions that make it trivial later*: token `comment` fields, deterministic palette, manifest with loomIds. When AI arrives, it targets an IR that already exists and is already proven — which is strictly better than designing the patch format before the IR stabilizes.
2. ~~React Native runtime~~ → becomes the *fifth* target. Note the asymmetry honestly: web/native share TSX via module aliasing; SwiftUI/Compose are codegen-only from IR. Both paths were already in the architecture; the MVP sequencing just changes.
3. Round-trip Figma read-back, multi-theme density systems, imported-list examples — later phases, unchanged.

**Sequencing insight from the docs:** Lona's own evolution (colors → tokens → components → compositions, each independently consumable) is the right build order. A design system repo that ships *only* tokens plus a Figma styleguide is already useful to a team in week two; each subsequent layer compounds without revising the previous one.

The one thing I'd add to your scope list: **`loom docs`** — the MDX compositions already render variant matrices; exporting them as a static styleguide site is nearly free and gives designers a Figma-independent reference, which conveniently keeps the Figma file a pure projection.
