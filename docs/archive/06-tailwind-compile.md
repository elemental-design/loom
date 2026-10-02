# Right — and your instinct is correct: it must be compiled

As written, `p={8}` and `p={{ left: 8 }}` **silently break**. Tailwind's JIT compiler scans source files for *literal class strings* — `gap-3`, `p-8`, `pl-2` — and generates CSS only for what it can see. Our helpers compute class names at runtime (`"p-" + value`), so Tailwind never sees `p-8` in any scanned file and never emits it. This is the single most common Tailwind integration failure, and the previous implementation smuggled it in.

The fix falls directly out of the architecture we already have — for two reasons:

1. **The value universe is closed.** `p={8}` is a `SpacingToken` — a member of the finite scale from `tokens.ts`. Every possible class is enumerable at build time.
2. **We already run a compiler over the source.** `loomc` parses every `.loom.tsx` for IR extraction — it can emit Tailwind classes as a byproduct, the same way it emits the IR.

---

## 1. Primary Mechanism: Compiler-Generated Safelist

The token emitter (`compiler/tokens/emit.ts`) already writes `generated/tailwind.config.ts`. Extend it: scan all `.loom.tsx` files, collect every token/prop combination actually used (or emit the full closed scale — simpler and cheap), and emit the safelist:

```ts
// generated/tailwind.config.ts (emitted by loomc — do not edit)
import type { Config } from "tailwindcss"

export default {
  // ...theme.extend.colors etc. from tokens.ts...
  safelist: [
    // spacing: full closed scale from tokens.spacing (1,2,3,4,6,8)
    "gap-1", "gap-2", "gap-3", "gap-4", "gap-6", "gap-8",
    "p-1", "p-2", "p-3", "p-4", "p-6", "p-8",
    "pt-1", "pt-2", /* ... px-, pl-, pr- × full scale ... */
    "mx-1", "mx-2", /* ... Divider insets ... */
    // axis
    "w-full", "h-full", "w-fit", "h-fit", "grow", "shrink-0",
    // radius
    "rounded-sm", "rounded-md", "rounded-lg", "rounded-full",
    // line clamp
    "line-clamp-1", "line-clamp-2", /* ... */
    // literal-scan results: every raw number found in .loom.tsx layout props
    "w-[44px]", "h-[44px]",
  ],
} satisfies Config
```

With the safelist in place, `p={8}` → `p-8` and `p={{ left: 8 }}` → `pl-8` work at runtime, because those classes were generated during the build. The class construction in `to-class.ts` is no longer a bug — it's safe by construction, and the drift check enforces safelist/config parity.

The safelist is generated from **three sources**, all closed sets:

| Source | Contents |
| --- | --- |
| Token scale | every spacing × position, gap, radius, line-clamp |
| Helper-derivable | combinations reachable from enum params (e.g. `Button.size` → `p-2/p-3/p-4`, `gap-2`) |
| Literal scan | every raw numeric literal appearing in layout props across `.loom.tsx` → `w-[44px]` style entries |

The third row handles your second example's edge: `width={44}` is off-scale, so the compiler writes the arbitrary class into the safelist *because it can see the literal in source*. If a number can't be seen statically (computed at runtime), that's a lint error — which is exactly the invariant we want.

## 2. Rules the Compiler Enforces (making `p={8}` type-safe and sound)

Because runtime-computed classes are only sound when the input space is closed, the lint rules tighten to:

1. **Layout numbers must be literals or token refs** — `p={8}` ✅, `p={tokens.spacing[4]}` ✅, `p={someProp}` ❌ unless `someProp` is an enum param whose variants are all token refs (the compiler resolves the value set from the type).
2. **Enum params resolve fully at compile time** — `padding(size)` where `size: "sm" | "md" | "lg"` is fine: the compiler evaluates the pure helper against all three inputs and safelists the three results. This is the `Button` case, and it's why helpers must be pure (already a rule).
3. **Off-scale literals get arbitrary classes + a warning** — `width={44}` emits `w-[44px]` and works, but is flagged: "44 is not on the spacing scale; consider `spacing[11]` or adding a semantic token."
4. **No runtime class composition outside `to-class.ts`** — user components never build strings; the primitives module is the only sanctioned site.

What compiles, concretely:

| Authoring | Emitted class | Mechanism |
| --- | --- | --- |
| `p={8}` | `p-8` | token scale safelist |
| `p={{ left: 8, right: 8 }}` | `px-8` (or `pl-8 pr-8`) | token scale safelist |
| `p={[3, 2]}` | `px-3 py-2` | shorthand → safelist |
| `padding={paddingFor(size)}` (enum) | `p-2 / p-3 / p-4` | helper evaluated per variant at build |
| `width={44}` | `w-[44px]` | literal scan → arbitrary safelist |
| `width={computeWidth(props)}` | — | ❌ compile error: unresolvable layout value |

## 3. Optional Second Tier: Zero-Runtime Transform

Since `loomc` already has the AST, it can go further and **rewrite** JSX into static classes at build time — a SWC/babel transform that turns:

```tsx
<HStack gap={2} align="center" padding={3}>
```

into (conceptually):

```tsx
<div className="flex flex-row items-center gap-2 p-3">
```

This makes the web runtime class-free (no `cn()` concatenation cost, no safelist dependency for fully-resolved cases) and makes the emitted source more conventional for shadcn shops reading the output. But it's an *optimization*, not the correctness mechanism — enum-param components (`Button`) still need the safelist for their runtime-resolved variants, so the safelist ships regardless. Recommend: safelist in Phase 2 (unblocks everything), transform as a Phase 5+ enhancement alongside shadcn codegen, since the generator emits static classes anyway.

## 4. Updated Invariant

Add to the agent's invariant list from the build plan:

> **Tailwind classes must exist at build time.** No runtime class construction without a compiler-generated safelist covering the full closed value universe. The compiler (a) emits the safelist from tokens + helper evaluation + literal scans, and (b) rejects any layout value it cannot resolve statically. "It works in the browser" is not acceptance; "the class exists in the emitted CSS" is.

This also retroactively explains why the architecture wanted a compiler in the loop from Phase 2, not just Phase 4 — the same AST pass that produces the IR is what makes the Tailwind runtime path sound.
