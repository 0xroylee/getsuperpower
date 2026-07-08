# GetSuperpower Workflow Catalog Spec

## ADDED Requirements

### Requirement: Startup Goal Is The Current Role Workflow Alias

GetSuperpower SHALL expose the startup role workflow under the canonical
`startup-goal` alias.

#### Scenario: user installs the startup goal workflow by alias

- **WHEN** a user reads current public installation guidance
- **THEN** the guidance shows `npx getsuperpower@latest install startup-goal`
- **AND** it does not present `startup-team` as the current public alias

#### Scenario: author validates the checked-in startup role workflow

- **WHEN** an author validates the checked-in startup role workflow
- **THEN** the source path is `examples/workflows/startup-goal`
- **AND** the manifest workflow name is `startup-goal`
- **AND** the lock file workflow name is `startup-goal`
- **AND** the workflow entry skill source is `./skills/startup-goal`

#### Scenario: user invokes the startup role workflow

- **WHEN** a user invokes the installed startup role workflow
- **THEN** the callable entry skill is `$startup-goal`
- **AND** the individual role skills remain callable by their existing names

### Requirement: Startup Goal Dispatches Role Work To Role Subagents

The startup goal entry skill SHALL coordinate role work through role-specific
subagents when role analysis or execution is needed.

#### Scenario: startup goal needs role-specific work

- **WHEN** the startup goal workflow determines that one or more roles are needed
- **THEN** it dispatches a separate subagent for each needed role
- **AND** each subagent receives the relevant role skill as its operating
  instruction
- **AND** each subagent receives a compact brief containing the startup goal, the
  current decision or task, prior handoff context, expected output, approval
  gate, and verification expectation

#### Scenario: startup goal combines role outputs

- **WHEN** role subagents return their outputs
- **THEN** the startup goal entry skill merges them into one owner-facing
  decision log
- **AND** it names which role is accountable for each decision
- **AND** it stops at human approval gates before advancing to the next role or
  phase

### Requirement: Startup Goal Landing Content Reflects Current Workflow Data

The landing workflow registry SHALL present Startup Goal as the primary startup
role workflow.

#### Scenario: visitor browses the workflow registry

- **WHEN** a visitor reaches the landing workflow registry
- **THEN** the registry includes Startup Goal
- **AND** the entry skill is `startup-goal`
- **AND** the install command is `npx getsuperpower@latest install startup-goal`
- **AND** the source link points to `examples/workflows/startup-goal`
- **AND** the registry still includes the individual startup role workflows
