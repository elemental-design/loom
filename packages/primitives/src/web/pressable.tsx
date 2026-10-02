import { useContext } from "react"
import type { PressableProps } from "../types.js"
import { AxisContext } from "./axis-context.js"
import { stackStyle } from "./style.js"

export const Pressable = ({ direction = "horizontal", onPress, disabled, ...props }: PressableProps) => {
  const parent = useContext(AxisContext)
  const axis = direction === "vertical" ? "column" : "row"
  return (
    <button
      type="button"
      className="loom-pressable"
      disabled={disabled}
      onClick={onPress}
      aria-label={props.label}
      style={{
        border: 0,
        padding: 0,
        font: "inherit",
        color: "inherit",
        textAlign: "inherit",
        cursor: "pointer",
        background: "none",
        ...stackStyle(props, axis, parent),
      }}
    >
      <AxisContext.Provider value={axis}>{props.children}</AxisContext.Provider>
    </button>
  )
}
