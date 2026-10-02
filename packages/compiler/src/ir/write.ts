const sortKeys = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(o)
        .filter((k) => o[k] !== undefined)
        .sort()
        .map((k) => [k, sortKeys(o[k])]),
    )
  }
  return v
}

export const writeJson = (v: unknown): string => JSON.stringify(sortKeys(v), null, 2) + "\n"
