import { useContext } from "react"
import type { HStackProps, VStackProps, ZStackProps } from "../types.js"
import { AxisContext } from "./axis-context.js"
import { roleAttrs } from "./role.js"
import { boxStyle, sizeStyle, stackStyle, zAlignStyle } from "./style.js"
import type { Axis } from "./axis-context.js"
import type { StackProps } from "../types.js"

const Stack = ({ props, axis }: { props: StackProps; axis: "row" | "column" }) => {
  const parent = useContext(AxisContext)
  return (
    <div
      style={stackStyle(props, axis, parent)}
      aria-label={props.label}
      {...roleAttrs(props.role)}
    >
      <AxisContext.Provider value={axis}>{props.children}</AxisContext.Provider>
    </div>
  )
}

export const HStack = (props: HStackProps) => <Stack props={props} axis="row" />
export const VStack = (props: VStackProps) => <Stack props={props} axis="column" />

export const ZStack = (props: ZStackProps) => {
  const parent: Axis = useContext(AxisContext)
  return (
    <div
      className="loom-zstack"
      style={{
        display: "grid",
        position: "relative",
        boxSizing: "border-box",
        ...zAlignStyle(props.alignment ?? "center"),
        ...boxStyle(props),
        ...sizeStyle(props.width, "width", parent),
        ...sizeStyle(props.height, "height", parent),
      }}
      aria-label={props.label}
      {...roleAttrs(props.role)}
    >
      <AxisContext.Provider value="z">{props.children}</AxisContext.Provider>
    </div>
  )
}
