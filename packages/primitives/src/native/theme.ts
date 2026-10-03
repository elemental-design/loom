import { createContext, useContext } from "react"

export interface Typography {
  fontSize: number
  lineHeight?: number
  fontWeight?: string
  fontFamily?: string
  letterSpacing?: number
}

export interface Theme {
  color: Record<string, string>
  space: Record<string | number, number>
  radius: Record<string, number>
  typography: Record<string, Typography>
}

export const ThemeContext = createContext<Theme | null>(null)

export const ThemeProvider = ThemeContext.Provider

export const useTheme = (): Theme => {
  const t = useContext(ThemeContext)
  if (!t) {
    throw new Error("LOOM301 <native>: no ThemeProvider found; wrap the tree in <ThemeProvider theme={...}>")
  }
  return t
}
