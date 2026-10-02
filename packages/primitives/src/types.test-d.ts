import { expectTypeOf, test } from "vitest"
import type { ColorName, Padding, PressableProps, SpacingKey } from "./types.js"

test("without augmentation", () => {
  expectTypeOf<"anything">().toExtend<ColorName>()
  expectTypeOf<string>().toExtend<ColorName>()
  expectTypeOf<SpacingKey>().toEqualTypeOf<number>()
})

test("Padding", () => {
  expectTypeOf<2>().toExtend<Padding>()
  expectTypeOf<[2, 3]>().toExtend<Padding>()
  expectTypeOf<{ left: 2 }>().toExtend<Padding>()
  expectTypeOf<[2]>().not.toExtend<Padding>()
  expectTypeOf<[2, 3, 4]>().not.toExtend<Padding>()
})

test("PressableProps", () => {
  expectTypeOf<PressableProps>().toHaveProperty("direction")
  expectTypeOf<PressableProps>().toHaveProperty("onPress")
  expectTypeOf<PressableProps>().toHaveProperty("disabled")
  expectTypeOf<PressableProps>().not.toHaveProperty("role")
})
