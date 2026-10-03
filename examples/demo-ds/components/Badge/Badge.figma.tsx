/// <reference path="../../../../packages/primitives/src/native/host-shim.d.ts" />
// Consumer file: binds the native primitives to the react-figmaapp host.
// Typechecked only (not run); Loom does not generate *.figma.tsx.
import { Text, ZStack } from "@loom/primitives/figma"
import { render } from "react-figmaapp"

export const loom = { id: "cmp_badge", version: "1.0.0" } as const

export const BadgeFigma = () => (
  <ZStack width={20} height={20} cornerRadius="full" background="danger">
    <Text typography="caption2" color="onDanger" align="center">
      1
    </Text>
  </ZStack>
)

export const figma = (): void => {
  render(<BadgeFigma />, { name: "Badge" })
}
