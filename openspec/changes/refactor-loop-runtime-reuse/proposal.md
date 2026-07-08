# Proposal: Refactor Loop Runtime Reuse

## Summary

Move the generic workflow loop behavior out of the example
`examples/workflows/grilled-product-dev/loop.mjs` and into a reusable runtime
surface.

The current `loop.mjs` proves the v1 contract, but it now owns too many
responsibilities:

- CLI parsing for `start`, `status`, `log`, `advance`, and `summary`.
- Global run-state and structured-event persistence.
- Status/action rendering.
- Summary generation.
- Workflow-specific manifest loading and next-step output.

The refactor should keep the existing workflow author contract simple:

```bash
node loop.mjs status --latest --json
```

but make the workflow-local `loop.mjs` a thin wrapper around shared runtime code.

## Motivation

Looped workflows should be easy to author more than once. If each workflow has to
copy a few hundred lines of command, state, and event logic into its own
`loop.mjs`, the runtime becomes hard to fix and hard to trust:

- A bug fix in one workflow script will not automatically reach the next one.
- Tests exercise one example script instead of a reusable runtime contract.
- Installed workflow skills receive a large generated script that looks
  workflow-specific even when most of it is generic.
- A future CLI command, if added, would likely duplicate the same command
  dispatch and persistence logic.

This should become a small, stable runtime seam that can be used by thin
workflow wrappers and, later, by a CLI adapter if that still feels useful.

## Scope

In scope:

- Extract generic loop command behavior into a reusable Node-compatible ESM
  runtime.
- Keep `node loop.mjs <command>` as the user and agent-facing workflow command.
- Reduce workflow-authored `loop.mjs` to a small wrapper that points the runtime
  at the local `workflow.json`.
- Preserve the existing manifest contract:
  - `loop.script` points to a relative `.mjs` file inside the workflow bundle.
  - loop state is `global`.
  - execution is `action-only`.
  - exactly one local workflow skill is marked `entry: true`.
- Preserve existing commands and JSON output shape for `start`, `status`, `log`,
  `advance`, and `summary`.
- Keep installed looped workflows self-contained enough to run with `node`,
  without depending on Bun or a repo checkout.
- Update install preparation so any shared runtime asset needed by the thin
  wrapper is copied into the installed entry skill destination.
- Rename the active internal runtime module namespace from
  `src/runtimes/ponytrail/` to `src/runtimes/getsuperpower/`, and update source
  imports, tests, and docs that point at the old runtime path.
- Add focused tests for the reusable runtime seam, the thin example wrapper, and
  install-time copied runtime files.
- Update author docs so workflow authors know what belongs in `loop.mjs` and
  what is provided by the shared runtime.

Out of scope:

- Changing the v1 loop state location.
- Changing the v1 command names.
- Turning the loop into an autonomous agent executor.
- Adding automatic phase execution.
- Requiring `getsuperpower` to be globally installed for an installed skill's
  `loop.mjs` to work.
- Adding a new npm dependency.
- Rewriting unrelated workflow-bundle install behavior.
- Renaming unrelated legacy hook filenames or generated artifacts, such as
  `ponytrail-prehook.sh`, unless they are required by the module path rename.

## Proposed Design Direction

Use a reusable runtime module plus a thin workflow wrapper.

The shared runtime should live in the renamed GetSuperpower runtime namespace,
for example `src/runtimes/getsuperpower/workflow-loop-runtime.mjs`, and own the
generic behavior:

- parse loop CLI arguments;
- load and validate the workflow manifest enough for runtime use;
- create and update global run state;
- append and read structured events;
- resolve `--run` and `--latest`;
- build action-only status payloads;
- write mechanical summaries;
- render JSON and plain text output.

The workflow-local `loop.mjs` should only do small local setup, roughly:

```js
#!/usr/bin/env node

import { runWorkflowLoopCli } from "./loop-runtime.mjs";

await runWorkflowLoopCli({
  argv: process.argv.slice(2),
  workflowJson: new URL("./workflow.json", import.meta.url),
});
```

During source validation and install:

- `validate` remains read-only.
- `install` prepares the entry skill with:
  - copied `workflow.json`;
  - copied thin `loop.mjs`;
  - generated `loop.metadata.json`;
  - copied shared runtime asset, such as `loop-runtime.mjs`.

This keeps installed skills Node-portable and avoids a hard dependency on a
global `getsuperpower` command. A future `getsuperpower loop ...` command can be
implemented as another adapter over the same runtime, but it should not be the
only execution path for installed workflows.

As part of the same refactor, the existing `src/runtimes/ponytrail/` folder
should move to `src/runtimes/getsuperpower/`. Active code and docs should stop
teaching new contributors that the GetSuperpower workflow runtime lives under
the old Ponytrail name.

## Acceptance Criteria

- `examples/workflows/grilled-product-dev/loop.mjs` is a small wrapper, not the
  owner of generic state/event/command behavior.
- The reusable runtime exposes a clear programmatic entrypoint for loop command
  execution.
- `node examples/workflows/grilled-product-dev/loop.mjs start --run smoke
  --json` still works.
- `node examples/workflows/grilled-product-dev/loop.mjs status --latest --json`
  still returns the current step instruction and action list.
- `log`, `advance`, and `summary` keep their current behavior and output shape.
- Installed entry skills for looped workflows include every file needed for
  `node loop.mjs ...` to run outside the source repo.
- Non-looped workflows install exactly as before.
- Existing loop metadata remains generated automatically from `workflow.json`.
- Active runtime imports use `src/runtimes/getsuperpower/` instead of
  `src/runtimes/ponytrail/`.
- Tests cover the reusable runtime directly and the workflow wrapper through
  Node.
- Tests cover prepared install dependencies copying the shared runtime asset.
- `rtk bun run check` passes before delivery.

## Resolved Review Decisions

- The shared runtime asset will live as a checked-in Node-compatible `.mjs`
  file.
- GetSuperpower will copy the standard `loop-runtime.mjs` asset automatically
  when `workflow.json` declares `loop`.
- V1 will not add a `getsuperpower loop` adapter. The stable command remains
  `node loop.mjs ...`.
- The active internal runtime namespace will move from `src/runtimes/ponytrail/`
  to `src/runtimes/getsuperpower/`.
