import { describe, expect, test } from "vitest"
import {
  GenError, colorClass, gapClass, iconSizeClass, paddingClasses, radiusClass, sizeClass, spacingClass,
  typographyClasses, zAlignClasses, type GenTokens,
} from "./maps.js"

const t: GenTokens = { spacing: { 1: 4, 2: 8, 3: 12, 5: 22 }, radius: new Set(["sm", "full"]) }

describe("maps", () => {
  test("spacing uses scale class when px == 4k, else arbitrary", () => {
    expect(gapClass(2, t)).toBe("gap-2")
    expect(gapClass(5, t)).toBe("gap-[22px]")
    expect(() => gapClass(9, t)).toThrow(GenError)
  })
  test("padding forms", () => {
    expect(paddingClasses(3, t)).toEqual(["p-3"])
    expect(paddingClasses([1, 2], t)).toEqual(["py-1", "px-2"])
    expect(paddingClasses({ left: 2, top: 1 }, t)).toEqual(["pt-1", "pl-2"])
    expect(spacingClass("min-w", 3, t)).toBe("min-w-3")
  })
  test("size by parent axis", () => {
    expect(sizeClass(20, "width", "none")).toEqual(["w-5"])
    expect(sizeClass(22, "height", "none")).toEqual(["h-[22px]"])
    expect(sizeClass("50%", "width", "row")).toEqual(["w-[50%]"])
    expect(sizeClass("hugging", "height", "row")).toEqual(["h-fit"])
    expect(sizeClass("fill", "width", "row")).toEqual(["flex-1", "min-w-0"])
    expect(sizeClass("fill", "width", "column")).toEqual(["self-stretch"])
    expect(sizeClass("fill", "height", "column")).toEqual(["flex-1", "min-h-0"])
    expect(sizeClass("fill", "height", "row")).toEqual(["self-stretch"])
    expect(sizeClass("fill", "width", "z")).toEqual(["w-full"])
    expect(sizeClass("fill", "height", "none")).toEqual(["h-full"])
    expect(() => sizeClass("wide", "width", "none")).toThrow(GenError)
  })
  test("colors, radius, typography, icon size, z alignment", () => {
    expect(colorClass("bg", "accent")).toBe("bg-primary")
    expect(colorClass("text", "onDanger")).toBe("text-destructive-foreground")
    expect(colorClass("bg", "transparent")).toBe("bg-transparent")
    expect(colorClass("bg", "brandTeal")).toBe("bg-loom-brand-teal")
    expect(radiusClass("full", t)).toBe("rounded-full")
    expect(() => radiusClass("xl", t)).toThrow(GenError)
    expect(typographyClasses("caption2")).toEqual(["text-[11px]", "leading-[13px]"])
    expect(() => typographyClasses("nope")).toThrow(GenError)
    expect(iconSizeClass(20)).toBe("size-5")
    expect(iconSizeClass(18)).toBe("size-[18px]")
    expect(zAlignClasses("center")).toEqual(["place-items-center"])
    expect(zAlignClasses("topEnd")).toEqual(["items-start", "justify-items-end"])
  })
})
