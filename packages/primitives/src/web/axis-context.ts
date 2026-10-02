import { createContext } from "react"

export type Axis = "row" | "column" | "z" | "none"

export const AxisContext = createContext<Axis>("none")
