/// <reference path="./host-shim.d.ts" />
// Host packages are optional peers and not installed; their shape is declared
// by the ambient stubs in host-shim.d.ts.
import * as RN from "react-native"

import { createPrimitives } from "./create.js"

export const {
  ThemeProvider, HStack, VStack, ZStack, Spacer, Divider, Text, Image, Icon, Pressable,
} = createPrimitives(RN as unknown as import("./host.js").Host)
