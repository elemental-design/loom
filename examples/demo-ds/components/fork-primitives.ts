import { createRequire } from "node:module"
import { createPrimitives } from "@loom/primitives/native"
import type { Host } from "../../../packages/primitives/src/native/host.js"

const requireFork = createRequire("../../../../react-sketchapp2/lib/figma.js")

export const { ThemeProvider, HStack, VStack, ZStack, Spacer, Divider, Text, Image, Icon, Pressable } =
  createPrimitives(requireFork("./index") as Host)
