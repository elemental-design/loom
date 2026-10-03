import { createElement } from "react"
import type { ReactNode } from "react"
import type {
  DividerProps,
  HStackProps,
  IconProps,
  ImageProps,
  PressableProps,
  SpacerProps,
  TextProps,
  VStackProps,
  ZStackProps,
} from "../types.js"
import { AxisContext, useAxis } from "./axis-context.js"
import type { Axis, Host, Style, StyleOrFn } from "./host.js"
import { ThemeProvider, useTheme } from "./theme.js"
import {
  boxStyle, colorOf, sizeStyle, spaceOf, stackStyle, typographyOf, zAlignParts,
} from "./style.js"

export interface Primitives {
  ThemeProvider: typeof ThemeProvider
  HStack: (props: HStackProps) => ReactNode
  VStack: (props: VStackProps) => ReactNode
  ZStack: (props: ZStackProps) => ReactNode
  Spacer: (props: SpacerProps) => ReactNode
  Divider: (props: DividerProps) => ReactNode
  Text: (props: TextProps) => ReactNode
  Image: (props: ImageProps) => ReactNode
  Icon: (props: IconProps) => ReactNode
  Pressable: (props: PressableProps) => ReactNode
}

// Flatten fragments so each ZStack child gets its own absolute wrapper.
const flatten = (nodes: ReactNode): ReactNode[] => {
  const out: ReactNode[] = []
  const walk = (n: ReactNode): void => {
    if (Array.isArray(n)) {
      n.forEach(walk)
      return
    }
    out.push(n)
  }
  walk(nodes)
  return out
}

const Wrapper = ({
  host,
  axis,
  style,
  children,
}: {
  host: Host
  axis: Axis
  style?: Style
  children?: ReactNode
}) => {
  const el = createElement(host.View, { style }, children)
  return <AxisContext.Provider value={axis}>{el}</AxisContext.Provider>
}

const Stack = ({
  host,
  props,
  axis,
  theme,
  parent,
}: {
  host: Host
  props: HStackProps | VStackProps
  axis: "row" | "column"
  theme: ReturnType<typeof useTheme>
  parent: Axis
}) => (
  <Wrapper host={host} axis={axis} style={stackStyle(theme, props, axis, parent)}>
    {props.children}
  </Wrapper>
)

export const createPrimitives = (host: Host): Primitives => {
  const HStack = (props: HStackProps) => {
    const theme = useTheme()
    const parent = useAxis()
    return <Stack host={host} props={props} axis="row" theme={theme} parent={parent} />
  }

  const VStack = (props: VStackProps) => {
    const theme = useTheme()
    const parent = useAxis()
    return <Stack host={host} props={props} axis="column" theme={theme} parent={parent} />
  }

  const ZStack = (props: ZStackProps) => {
    const theme = useTheme()
    const parent = useAxis()
    if (typeof props.width !== "number" || typeof props.height !== "number") {
      throw new Error("LOOM302 <ZStack>: native ZStack requires numeric width and height")
    }
    const { v, h } = zAlignParts(props.alignment ?? "center")
    return (
      <Wrapper
        host={host}
        axis="z"
        style={{ position: "relative", width: props.width, height: props.height, ...boxStyle(theme, props) }}
      >
        {flatten(props.children).map((child, i) => (
          <host.View
            key={i}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, ...v, ...h }}
          >
            {child}
          </host.View>
        ))}
      </Wrapper>
    )
  }

  const Spacer = ({ min }: SpacerProps) => {
    const theme = useTheme()
    const m = min === undefined ? 0 : spaceOf(theme, min)
    return <host.View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: m, minHeight: m }} />
  }

  const Divider = ({ axis = "horizontal", inset, color }: DividerProps) => {
    const theme = useTheme()
    const backgroundColor = color === undefined ? colorOf(theme, "separator") : colorOf(theme, color)
    const i = inset === undefined ? undefined : spaceOf(theme, inset)
    return (
      <host.View
        style={{
          backgroundColor,
          alignSelf: "stretch",
          flexShrink: 0,
          ...(axis === "horizontal"
            ? { height: 1, ...(i !== undefined && { marginVertical: i }) }
            : { width: 1, ...(i !== undefined && { marginHorizontal: i }) }),
        }}
      />
    )
  }

  const Text = ({ children, typography = "body", color = "textPrimary", lines, align, role, label }: TextProps) => {
    const theme = useTheme()
    const t = typographyOf(theme, typography)
    return (
      <host.Text
        numberOfLines={lines}
        accessibilityRole={role === "header" ? "header" : undefined}
        accessibilityLabel={label}
        style={{
          ...t,
          color: colorOf(theme, color),
          ...(align === "start" ? { textAlign: "left" }
            : align === "end" ? { textAlign: "right" }
            : align === "center" ? { textAlign: "center" }
            : {}),
        }}
      >
        {children}
      </host.Text>
    )
  }

  const Image = ({ src, width, height, resizeMode = "cover", cornerRadius, label }: ImageProps) => {
    const theme = useTheme()
    const parent = useAxis()
    return (
      <host.Image
        source={{ uri: src }}
        resizeMode={resizeMode}
        accessibilityLabel={label}
        style={{
          ...(cornerRadius !== undefined ? boxStyle(theme, { cornerRadius }) : {}),
          ...sizeStyle(width, "width", parent),
          ...sizeStyle(height, "height", parent),
        }}
      />
    )
  }

  const warned = new Set<string>()

  const Icon = ({ name, size = 20, color = "textPrimary" }: IconProps) => {
    const theme = useTheme()
    if (!warned.has(name)) {
      warned.add(name)
      if (process.env.NODE_ENV !== "production") {
        console.warn(`LOOM303 Icon "${name}" has no native glyph source`)
      }
    }
    return (
      <host.View
        accessibilityLabel={name}
        style={{ width: size, height: size, backgroundColor: colorOf(theme, color) }}
      />
    )
  }

  const styleOrFn = (s: Style, f?: (state: { pressed: boolean }) => Style): StyleOrFn =>
    f === undefined ? s : (state) => ({ ...s, ...f(state) })

  const Pressable = ({ direction = "horizontal", onPress, disabled, ...props }: PressableProps) => {
    const theme = useTheme()
    const parent = useAxis()
    const axis: Axis = direction === "vertical" ? "column" : "row"
    const base = stackStyle(theme, props, axis, parent)
    const style: StyleOrFn = styleOrFn(
      { ...base, opacity: disabled ? 0.5 : 1 },
      host.Pressable ? (state) => (state.pressed ? { opacity: 0.8 } : {}) : undefined,
    )
    const content = (
      <AxisContext.Provider value={axis}>{props.children}</AxisContext.Provider>
    )
    if (host.Pressable) {
      return (
        <host.Pressable
          onPress={onPress}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={props.label}
          style={style}
        >
          {content}
        </host.Pressable>
      )
    }
    // No host Pressable (Sketch/Figma): render a View; onPress is inert.
    return (
      <host.View
        accessibilityRole="button"
        accessibilityLabel={props.label}
        style={style as Style}
      >
        {content}
      </host.View>
    )
  }

  return {
    ThemeProvider,
    HStack, VStack, ZStack, Spacer, Divider, Text, Image, Icon, Pressable,
  }
}
