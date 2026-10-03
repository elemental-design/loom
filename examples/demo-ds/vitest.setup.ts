// Rebind the vendored react-sketchapp2 fork (../../react-sketchapp2) to the
// workspace's React 19 + react-test-renderer 19.
//
// The fork is CommonJS living outside the workspace and ships its own React 16
// copies; vitest resolve aliases never reach its `require("react")` calls
// (externalized CJS goes through the plain Node loader). Without this patch,
// React 16's test renderer cannot reconcile React 19 elements (React 19 changed
// the element type symbol), which surfaces as "Objects are not valid as a
// React child".
import Module from "node:module"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const workspaceRequire = createRequire(new URL("../../package.json", import.meta.url))
const react19 = workspaceRequire.resolve("react")
const reactTestRenderer19 = workspaceRequire.resolve("react-test-renderer")
const forkRoot = fileURLToPath(new URL("../../react-sketchapp2/", import.meta.url))

const originalLoad = Module._load

Module._load = function patchedLoad(request, parent, isMain) {
  const importer = parent?.filename ?? ""
  if (importer.startsWith(forkRoot)) {
    if (request === "react") {
      
      return originalLoad(react19, parent, isMain)
    }
    if (request === "react-test-renderer") {
      
      return originalLoad(reactTestRenderer19, parent, isMain)
    }
  }
  return originalLoad(request, parent, isMain)
}

// react-test-renderer's act() requires this; buildTree() calls act when present.
globalThis.IS_REACT_ACT_ENVIRONMENT = true
