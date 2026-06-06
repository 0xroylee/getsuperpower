# Project Run Hooks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement project-level before/after workflow hook scripts that are editable from the Projects UI and executed by the CLI workflow runtime.

**Architecture:** Store nullable hook script fields on `board_projects`, expose them through the existing project API and web client types, and feed them into CLI `ResolvedProjectConfig` through the current `/api/projects` metadata overlay. Runtime execution uses a focused hook helper that writes scripts to temporary files and invokes `sh <script>` with structured argv in `project.executionPath`.

**Tech Stack:** TypeScript, Bun tests, Drizzle schema/migrations, Next.js React UI, existing devos CLI/server/web package structure.

---

### Task 1: Persist Project Hook Fields

**Files:**
- Modify: `packages/db/src/schema/board-projects.schema.ts`
- Create: `packages/db/src/migrations/0021_project_run_hooks.sql`
- Modify: `packages/server/src/http/project-task-schemas.ts`
- Modify: `packages/server/src/http/types/project-task-api.types.ts`
- Modify: `packages/server/src/projects/project-service.ts`
- Modify: `packages/server/src/board/board-repository.ts`
- Modify: `packages/server/src/board/types/board.types.ts`
- Modify: `packages/server/src/realtime/project-events.ts`
- Test: `packages/server/tests/project-routes.test.ts`
- Test: `packages/server/tests/board-routes.test.ts`
- Test: `packages/server/tests/server-db-schema.test.ts`

- [ ] **Step 1: Write failing server/db tests**

Add assertions that create/update/list/read project payloads include `preHookScript` and `afterHookScript`, blank hook scripts normalize to `null`, workspace project board responses include both fields, and representative DB insert/read includes both columns.

- [ ] **Step 2: Run tests and verify RED**

Run: `rtk bun test packages/server/tests/project-routes.test.ts packages/server/tests/board-routes.test.ts packages/server/tests/server-db-schema.test.ts`

Expected: FAIL because hook fields are absent from schema/API payloads.

- [ ] **Step 3: Implement persistence and mapping**

Add text columns, migration SQL, zod payload fields, service create mapping, repository select mapping, board summary types, and realtime project event mapping for both hook fields.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `rtk bun test packages/server/tests/project-routes.test.ts packages/server/tests/board-routes.test.ts packages/server/tests/server-db-schema.test.ts`

Expected: PASS.

### Task 2: Add Web Project Form Hook Editing

**Files:**
- Modify: `packages/web/src/lib/api/types/project.types.ts`
- Modify: `packages/web/src/lib/api/board-client.ts`
- Modify: `packages/web/src/components/projects/types/projects-panel.types.ts`
- Modify: `packages/web/src/components/projects/project-form-utils.ts`
- Modify: `packages/web/src/components/projects/project-form-dialog.tsx`
- Test: `packages/web/tests/project-form-utils.test.ts`

- [ ] **Step 1: Write failing web tests**

Add tests proving create/update request builders include trimmed hook scripts, blank scripts become `null`, and edit form hydration restores saved hook scripts.

- [ ] **Step 2: Run tests and verify RED**

Run: `rtk bun test packages/web/tests/project-form-utils.test.ts`

Expected: FAIL because form state and request payloads have no hook fields.

- [ ] **Step 3: Implement web types, parser, form state, request mapping, and UI**

Add `preHookScript` and `afterHookScript` to project records/requests, parse them from API responses, add form fields, map them through create/update/edit helpers, and render a Hooks section with two textareas in the project dialog.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `rtk bun test packages/web/tests/project-form-utils.test.ts`

Expected: PASS.

### Task 3: Overlay Hook Metadata Into CLI Config

**Files:**
- Modify: `packages/cli/src/features/config/types/runtime.types.ts`
- Modify: `packages/cli/src/features/config/project-metadata.ts`
- Test: `packages/cli/tests/config.test.ts`

- [ ] **Step 1: Write failing CLI metadata test**

Extend the server metadata overlay test so a mocked server project row includes `preHookScript` and `afterHookScript`, then assert `config.projects[0]?.preHookScript` and `afterHookScript` match.

- [ ] **Step 2: Run test and verify RED**

Run: `rtk bun test packages/cli/tests/config.test.ts -t "overlays project metadata"`

Expected: FAIL because hook fields are ignored.

- [ ] **Step 3: Implement config types and metadata parsing**

Add nullable optional hook properties to runtime project config, accept nullable hook strings in server project row parsing, and apply them to resolved project config as `string | undefined`.

- [ ] **Step 4: Run test and verify GREEN**

Run: `rtk bun test packages/cli/tests/config.test.ts -t "overlays project metadata"`

Expected: PASS.

### Task 4: Execute Project Run Hooks Around Workflow Pipeline

**Files:**
- Create: `packages/cli/src/features/workflow/hooks/project-run-hooks.ts`
- Modify: `packages/cli/src/features/workflow/pipeline/issue-pipeline-executor.ts`
- Test: `packages/cli/tests/workflow-pipeline.test.ts`

- [ ] **Step 1: Write failing runtime tests**

Add tests for a hook helper or executor injection showing pre-hook runs before the pipeline, pre-hook failure throws before phase work, after-hook runs after workflow completion, and after-hook failure is recorded/logged without changing a successful workflow result.

- [ ] **Step 2: Run tests and verify RED**

Run: `rtk bun test packages/cli/tests/workflow-pipeline.test.ts`

Expected: FAIL because hook execution is not implemented.

- [ ] **Step 3: Implement hook helper and executor integration**

Create a helper that skips blank scripts, writes scripts to temporary files, runs `sh <script>` through `runCommand` with the existing prep timeout, removes temp files, throws on pre-hook failure, and logs after-hook failure without throwing. Wire it into `IssuePipelineExecutor.execute()`.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `rtk bun test packages/cli/tests/workflow-pipeline.test.ts`

Expected: PASS.

### Task 5: Validate The Integrated Change

**Files:**
- Verify changed packages only, then root gates where possible.

- [ ] **Step 1: Run focused tests**

Run:
`rtk bun test packages/server/tests/project-routes.test.ts packages/server/tests/board-routes.test.ts packages/server/tests/server-db-schema.test.ts packages/web/tests/project-form-utils.test.ts packages/cli/tests/config.test.ts packages/cli/tests/workflow-pipeline.test.ts`

Expected: PASS.

- [ ] **Step 2: Run package checks**

Run:
`rtk bun run --filter devos-db check`
`rtk bun run --filter devos-server check`
`rtk bun run --filter web typecheck`
`rtk bun run --filter devos check`

Expected: PASS, or report external dependency/sandbox blockers.

- [ ] **Step 3: Run root gates**

Run:
`rtk bun run check`
`rtk bun run typecheck`
`rtk bun test`

Expected: PASS, or report unrelated pre-existing failures separately.
