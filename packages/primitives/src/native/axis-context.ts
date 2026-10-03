import { createContext, useContext } from "react"

export type Axis = "row" | "column" | "z" | "none"

export const AxisContext = createContext<Axis>("none")

export const useAxis = (): Axis => useContext(AxisContext)
