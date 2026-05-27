# Agent Adapters Package Instructions

This package owns runtime adapters that execute external coding agents for
devos.ing workflow stages. Keep provider execution here and keep workflow,
Linear, GitHub, database, and run-state policy in the CLI or server packages.

## Rules

1. Keep adapter contracts in dedicated `types/*.types.ts` modules.
2. Keep provider code free of workflow, Linear, GitHub, database, and run-state
   logic.
3. Build runtime invocations as structured `{ command, args, cwd, env }` style
   data; do not assemble raw shell command strings.
4. Normalize provider output into `AgentResult`, including `finalMessage`,
   `stdout`, optional `sessionId`, and optional usage.
5. Add focused tests for provider parsing, command argument construction,
   session IDs, usage mapping, and error behavior.
6. Keep provider-specific files grouped by provider and then by purpose/action,
   such as `src/codex/cli/execute/*`, `src/codex/cli/parse/*`, and
   `src/codex/web/*`.
7. Keep provider roots consistent: `adapter.ts`, `constants.ts`, `index.ts`,
   and compatibility re-export files for stable public subpaths.
8. Keep shared backend/model metadata in `src/registry.ts` and
   `src/types/agent-registry.types.ts`.
9. Keep shared cross-provider helpers under `src/shared/<purpose>/*`, and only
   create `server`, `web`, `quota`, or similar folders when real code exists.
10. Export shared provider surfaces through `package.json` subpaths only when
   callers need a stable boundary.
11. Keep TypeScript files under 250 lines.
