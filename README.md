# loom

Author UI components once in TSX using a small, SwiftUI-shaped primitive set (`HStack`, `VStack`, `ZStack`, `Spacer`, `Divider`, `Text`, `Image`, `Icon`, `Pressable`) and design tokens. A compiler then:

- generates tokens (HCT palette → CSS variables, shadcn aliases, Tailwind v4 theme),
- extracts a JSON IR from the TSX,
- emits standalone shadcn/Tailwind components with no Loom dependency.

Later targets: Figma, SwiftUI, Jetpack Compose, React Native.

Status: pre-implementation. Spec and tasks are ready.

- Humans: start at `docs/spec/00-overview.md`, then `docs/DECISIONS.md`.
- Coding agents: start at `AGENTS.md`.
- History: `docs/archive/` (superseded notes).
