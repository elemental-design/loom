# T00 — Monorepo scaffold

**Goal:** empty but working pnpm/TS/vitest monorepo; `pnpm -r build`, `pnpm -r typecheck`, `pnpm -r test` all pass.

**Read:** `docs/spec/00-overview.md` (Packages section only).

## Create
- `package.json` (private, `"type":"module"`, scripts: `build`, `typecheck`, `test` each `pnpm -r <name>`), `pnpm-workspace.yaml` (`packages/*`, `examples/*`), `tsconfig.base.json` (strict, `"module":"NodeNext"`, `"target":"ES2022"`, `"jsx":"react-jsx"`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`), `.nvmrc` (22), `vitest.config.ts` at root is NOT used; each package has its own.
- `packages/primitives/` : `package.json` (`@loom/primitives`, exports `.` → `src/index.ts`, `./primitives.css` → `src/primitives.css`; peer deps react, lucide-react), `tsconfig.json`, `src/index.ts` (`export {}`), `src/smoke.test.ts` (`expect(1).toBe(1)`).
- `packages/compiler/` : `package.json` (`@loom/compiler`, bin `loom` → `src/cli.ts` run via `tsx`; deps: `ts-morph`, `@material/material-color-utilities`, `commander`; dev: `tsx`, `vitest`), `tsconfig.json`, `src/index.ts` (`export {}`), `src/cli.ts` (prints usage; subcommands `tokens build`, `extract`, `lint`, `gen web` registered, each printing "not implemented" and exiting 1), `src/smoke.test.ts`.
- `examples/demo-ds/` : `package.json` (private; deps `@loom/primitives`, `@loom/compiler` as `workspace:*`; react, react-dom, vite, `@vitejs/plugin-react`, lucide-react, class-variance-authority, tailwindcss, `@tailwindcss/vite`, typescript, vitest), `tsconfig.json`, empty `components/`.
- Update `.gitignore` additions if missing: `node_modules`, `dist` is **not** ignored in `examples/demo-ds/dist` (committed), ignore `packages/*/dist`.

## Rules
- Use packages' source directly (no build step for libs): `main`/`exports` point at `src/*.ts`; consumers run through vite/tsx/vitest. `build` script may be `tsc --noEmit` alias for now.
- Install latest stable majors; do not pin exotic versions. Do not add other dependencies.

## Acceptance
```
pnpm install && pnpm typecheck && pnpm test
pnpm --filter @loom/compiler exec tsx src/cli.ts --help
```
Both exit 0 (the `--help` prints the four subcommands).

## Out of scope
Any real logic; CI config; lint/prettier setup; the `react-native` package field.
