# Omniskill CLI Rename Spec

## ADDED Requirements

### Requirement: Package And Binary Are Omniskill

The npm package metadata SHALL present `omniskill` as the package and
primary binary name.

#### Scenario: package metadata is inspected

- **WHEN** package metadata is read
- **THEN** the package name is `omniskill`
- **AND** the `omniskill` binary points at the built CLI
- **AND** the legacy `ponyrace` binary may remain as a transition alias

### Requirement: Omniskill Commands Are Root Commands

The CLI SHALL expose Omniskill workflow commands directly at the root level.

#### Scenario: user installs a workflow

- **WHEN** a user runs `omniskill install product-dev`
- **THEN** the CLI installs the same workflow and skill dependencies as the
  previous nested command

#### Scenario: user clones a workflow

- **WHEN** a user runs `omniskill clone product-dev`
- **THEN** the CLI records the installed workflow and installs required skills

### Requirement: Compatibility Aliases Remain Available

The CLI SHALL keep existing compatibility command paths during the rename.

#### Scenario: existing script uses nested command

- **WHEN** a script runs `omniskill omniskill install product-dev`
- **THEN** the command remains available as a compatibility alias

#### Scenario: existing script uses bundle or workflow aliases

- **WHEN** a script runs `bundle init` or `workflow install`
- **THEN** the command remains available as a compatibility alias
