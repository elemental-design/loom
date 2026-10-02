import type { Role } from "../types.js"

export const roleAttrs = (role: Role | undefined): Record<string, string | number> => {
  switch (role) {
    case "button": return { role: "button" }
    case "header": return { role: "heading", "aria-level": 2 }
    case "image": return { role: "img" }
    case "list": return { role: "list" }
    case "listitem": return { role: "listitem" }
    case "none": return { role: "presentation" }
    default: return {}
  }
}
