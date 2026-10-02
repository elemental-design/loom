# 06 — Deferred work (NOT READY FOR IMPLEMENTATION)

Each item needs its own spec pass before a task is written. Agents: do not start these. Listed with the decisions already made so they are not lost. Source ideas live in `docs/archive/` (humans only).

| Item | Decisions already made | Prerequisite |
| --- | --- | --- |
| **Figma renderer** (primitives → Figma nodes; tokens → variables; styleguide pages) | HStack/VStack → auto-layout (`itemSpacing`=gap, `layoutSizing FILL/HUG`); ZStack → no auto-layout; Pressable → component set; `pluginData` stores `{loomId, irHash}`; each tool writes provenance only under its own namespace (`loom.figma.*`) and passes foreign keys through | stable node ids in IR (currently path-based); manifest design; M4 complete |
| **SwiftUI codegen** (IR → SwiftUI) | `spaceBetween` → `Spacer()` expansion; gap → `spacing:`; variants → enums; theme via Environment | M4; IR proven by web |
| **Compose codegen** | Row/Column/Box; `Arrangement.spacedBy`; slots → trailing lambdas; typography → Material 3 names (archive/04) | M4 |
| **React Native runtime** | `"react-native"` field in `@loom/primitives` package.json resolves native impl; token → numbers via theme provider | web primitives stable; decide Pressable/ZStack native semantics |
| **Dark mode** | tone inversion of the same seeds; `[data-theme=dark]` vars; RN theme provider | contrast table per mode |
| **MDX docs / Storybook / `loom docs`** | `<Canvas>` instantiations become compositions; variant×viewport matrix | compositions format (currently plain `.compositions.ts`) |
| **Viewports on compositions** | `{name,width,heightMode: atLeast\|exactly}` | MDX/docs |
| **AI patch layer** | AI emits ops against IR/tokens, validated by schema+lint+contrast, applied to source; capability ladder 0 recolor → 1 compose → 2 new components → 3 primitives (human only). Token `comment` fields already required | stable IR; patch→TSX writer |
| **Round-trip (Figma → source)** | patches validated by the same gate as AI | Figma renderer, AI/patch format |
| **Compound variants, `child` slots, `bindTo:` shadcn wrapping, `Grid/ScrollView/TextField`, forwardRef, zero-runtime Tailwind transform** | — | per-item design |
| **Per-node a11y extras** (`accessibilityElements` ordering, container/element types) | role/label exist on primitives now | SwiftUI/Compose design |
