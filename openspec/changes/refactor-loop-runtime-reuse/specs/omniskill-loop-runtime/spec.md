# Omniskill Loop Runtime Spec

## ADDED Requirements

### Requirement: Omniskill Runtime Namespace

Active workflow runtime modules SHALL live under a Omniskill-named source
namespace instead of the legacy Ponytrail namespace.

#### Scenario: contributor follows runtime imports

- **WHEN** a contributor opens the source exports, command wiring, tests, or
  architecture docs for workflow-bundle runtime behavior
- **THEN** active references point at `src/runtimes/omniskill/`
- **AND** new reusable loop runtime files are added under that namespace
- **AND** active workflow runtime code no longer imports from
  `src/runtimes/ponytrail/`

### Requirement: Reusable Loop Runtime Entry Point

Omniskill SHALL provide a reusable loop runtime entry point for workflows
that declare `loop` in `workflow.json`.

#### Scenario: workflow wrapper delegates to shared runtime

- **GIVEN** a workflow bundle declares a loop script at `./loop.mjs`
- **AND** the workflow's `loop.mjs` delegates to the shared runtime entry point
- **WHEN** a user runs `node loop.mjs status --latest --json`
- **THEN** the shared runtime handles command parsing, run lookup, state
  reading, event logging, and output rendering
- **AND** the wrapper only supplies local workflow configuration such as the
  `workflow.json` location

#### Scenario: reusable runtime is tested directly

- **WHEN** tests call the shared runtime entry point with injected arguments,
  home directory, and output streams
- **THEN** the runtime produces the same observable run-state and JSON payloads
  as the workflow wrapper

### Requirement: Thin Workflow Loop Script

Looped workflow examples SHALL keep workflow-local `loop.mjs` files thin.

#### Scenario: author inspects an example loop script

- **WHEN** an author opens
  `examples/workflows/grilled-product-dev/loop.mjs`
- **THEN** the file contains only the Node shebang, shared runtime import,
  workflow-local configuration, and error handling needed to invoke the runtime
- **AND** it does not duplicate generic run-state, event, argument parsing, or
  summary-generation logic

### Requirement: Installed Looped Workflows Remain Node-Portable

Installed looped workflow entry skills SHALL include every runtime file needed
to run `node loop.mjs ...` outside the source repository.

#### Scenario: install prepares a looped workflow entry skill

- **GIVEN** a workflow bundle declares `loop`
- **AND** one local skill is marked `entry: true`
- **WHEN** Omniskill prepares skill install dependencies
- **THEN** the prepared entry skill includes copied `workflow.json`
- **AND** copied `loop.mjs`
- **AND** generated `loop.metadata.json`
- **AND** the shared loop runtime asset required by `loop.mjs`

#### Scenario: installed loop script runs without Bun

- **GIVEN** a prepared or installed looped workflow entry skill
- **WHEN** a user runs `node loop.mjs start --run smoke --json` from that skill
  directory
- **THEN** the command succeeds using Node-compatible ESM files
- **AND** it does not require Bun, TypeScript transpilation, or the source repo
  checkout

### Requirement: Existing Loop Commands Stay Compatible

The reusable runtime SHALL preserve the existing loop command contract.

#### Scenario: status returns the current action

- **WHEN** a user runs `node loop.mjs status --latest --json`
- **THEN** the JSON response includes the workflow name, run id, status, current
  step, plain instruction, and action list

#### Scenario: phase events remain structured

- **WHEN** a user runs
  `node loop.mjs log --run smoke --type phase_result --message "done"
  --metadata '{"ok":true}' --json`
- **THEN** the runtime appends a structured JSONL event for the current run
- **AND** the JSON response reports the event type, step, message, metadata, and
  next actions

#### Scenario: sequential advancement remains guarded

- **WHEN** a user runs `node loop.mjs advance --run smoke --json`
- **THEN** the runtime advances to the next manifest step or completes the run
- **AND** forced advancement to a named step still requires both `--force` and
  `--reason`

### Requirement: Non-Loop Workflows Are Unchanged

Omniskill SHALL preserve install and validation behavior for workflows that
do not declare `loop`.

#### Scenario: workflow has no loop declaration

- **GIVEN** a workflow bundle without `loop`
- **WHEN** Omniskill validates or installs the workflow
- **THEN** no shared loop runtime asset is required
- **AND** no extra runtime files are copied into local skills
- **AND** existing dependency resolution behavior is unchanged
