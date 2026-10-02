import type { PrimitiveName } from "../ir/types.js"

export type PropKind = "color" | "spacing" | "radius" | "typography" | "px" | "style" | "content"

const STACK = {
  gap: "spacing", padding: "spacing", width: "px", height: "px", align: "style", justify: "style",
  background: "color", cornerRadius: "radius", clip: "style",
  role: "content", label: "content",
} as const satisfies Record<string, PropKind>

export const PROP_KINDS: Record<PrimitiveName, Record<string, PropKind>> = {
  HStack: STACK,
  VStack: STACK,
  ZStack: {
    alignment: "style", width: "px", height: "px", background: "color", cornerRadius: "radius", clip: "style",
    role: "content", label: "content",
  },
  Spacer: { min: "spacing" },
  Divider: { axis: "style", inset: "spacing", color: "color" },
  Text: {
    typography: "typography", color: "color", lines: "style", align: "style",
    content: "content", role: "content", label: "content",
  },
  Image: {
    width: "px", height: "px", resizeMode: "style", cornerRadius: "radius",
    src: "content", label: "content",
  },
  Icon: { size: "style", color: "color", name: "content" },
  Pressable: {
    ...STACK, direction: "style", onPress: "content", disabled: "content",
  },
}

export const isStyleKind = (k: PropKind | undefined): boolean => k !== undefined && k !== "content"
