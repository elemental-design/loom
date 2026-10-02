import { resolve } from "node:path"
import { Project } from "ts-morph"

export function loadProject(cwd: string, glob: string): Project {
  const project = new Project({ skipAddingFilesFromTsConfig: true })
  project.addSourceFilesAtPaths(resolve(cwd, glob))
  return project
}
