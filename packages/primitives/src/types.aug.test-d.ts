import { expectTypeOf } from "vitest"
import type { ColorName, SpacingKey, StackProps } from "./types.js"

declare module "./types.js" {
  interface LoomTokens {
    color: "accent" | "surface"
    spacing: 1 | 2 | 3
  }
}

expectTypeOf<ColorName>().toEqualTypeOf<"accent" | "surface" | "transparent">()
expectTypeOf<SpacingKey>().toEqualTypeOf<1 | 2 | 3>()

export const ok: StackProps = { gap: 2 }
// @ts-expect-error 4 is not a spacing key
export const bad: StackProps = { gap: 4 }
