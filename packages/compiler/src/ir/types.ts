export interface IRComponent {
  irVersion: 1
  id: string                 // from `loom.id`
  name: string
  version: string            // from `loom.version`
  source: string             // repo-relative path
  hash: string               // 12-hex source hash
  doc?: string
  params: IRParam[]
  root: IRNode
}

export interface IRParam {
  name: string
  type: "string" | "number" | "boolean" | "enum" | "icon" | "action" | "child" | "array"
  required: boolean
  default?: string | number | boolean
  values?: string[]                                   // enum
  fields?: { name: string; type: "string" | "number" | "boolean" }[]  // array
  doc?: string
}

export type PrimitiveName =
  "HStack" | "VStack" | "ZStack" | "Spacer" | "Divider" | "Text" | "Image" | "Icon" | "Pressable"

export type IRNode =
  | { kind: "primitive"; id: string; type: PrimitiveName; props: Record<string, IRExpr>; children: IRNode[]; when?: IRExpr }
  | { kind: "component"; id: string; ref: string /* loom.id */; name: string; props: Record<string, IRExpr>; when?: IRExpr }
  | { kind: "repeat"; id: string; over: IRExpr; as: string; key: IRExpr; children: IRNode[]; when?: IRExpr }

export type IRExpr =
  | { lit: string | number | boolean | null }
  | { param: string }
  | { var: string }                                  // repeat loop variable
  | { get: IRExpr; field: string }                   // member access
  | { not: IRExpr }
  | { op: "===" | "!==" | "<" | ">" | "<=" | ">=" | "&&" | "||" | "+"; l: IRExpr; r: IRExpr }
  | { cond: IRExpr; then: IRExpr; else: IRExpr }
  | { lookup: Record<string, IRExpr>; key: IRExpr }  // object-literal index
  | { call: "String"; arg: IRExpr }
