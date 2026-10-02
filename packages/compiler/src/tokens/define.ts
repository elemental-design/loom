export interface ColorRole {
  from: string
  tone: number
  comment: string
}

export interface TypographyDef {
  size: number
  line: number
  weight: number
}

export interface TokensDef {
  seeds: Record<string, string>
  colors: Record<string, ColorRole>
  contrast: Array<[string, string, number]>
  spacing: Record<string, number>
  radius: Record<string, number>
  typography: Record<string, TypographyDef>
}

export function defineTokens(def: TokensDef): TokensDef {
  return def
}
