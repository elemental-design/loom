/// <reference path="../../../../packages/primitives/src/native/host-shim.d.ts" />
// Consumer file: binds the native primitives to the react-sketchapp host.
// Typechecked only (not run); Loom does not generate *.sketch.tsx.
import { Text, ZStack } from "@loom/primitives/sketch"
import { render } from "react-sketchapp"

export const loom = { id: "cmp_badge", version: "1.0.0" } as const

export const BadgeSketch = () => (
  <ZStack width={20} height={20} cornerRadius="full" background="danger">
    <Text typography="caption2" color="onDanger" align="center">
      1
    </Text>
  </ZStack>
)

export const sketch = (): void => {
  // Sketch documents are created on demand; component dimensions come from the
  // primitives themselves, so only the page context is provided here.
  render(<BadgeSketch />, { name: "Badge" })
}
