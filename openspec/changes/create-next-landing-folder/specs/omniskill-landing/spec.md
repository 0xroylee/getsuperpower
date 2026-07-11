# Omniskill Landing Spec

## ADDED Requirements

### Requirement: Landing Folder Is Isolated From The CLI Package

The repository SHALL include a root `landing/` application for the public
Omniskill marketing surface without changing the root Bun CLI package
runtime.

#### Scenario: developer installs root CLI dependencies

- **WHEN** a developer runs the root package install and check workflow
- **THEN** CLI dependencies and checks remain governed by the root
  `package.json`
- **AND** landing app dependencies are declared inside `landing/package.json`

### Requirement: Landing App Uses Next.js And Tailwind CSS

The landing application SHALL be built as a Next.js 16 app styled with Tailwind
CSS.

#### Scenario: developer opens the landing app source

- **WHEN** a developer inspects `landing/`
- **THEN** the app uses Next.js app-router files for layout and page rendering
- **AND** page styling is expressed through Tailwind CSS utilities and global
  Tailwind CSS setup
- **AND** Vite-only entrypoints and configuration are absent from `landing/`

### Requirement: Landing Page Presents Omniskill Workflow Bundles

The landing page SHALL present Omniskill as a workflow-bundle product for
AI-agent skill trees.

#### Scenario: visitor reads the first screen

- **WHEN** a visitor opens the landing page
- **THEN** Omniskill is visible as the primary product signal
- **AND** the page explains that one install command provides a callable
  workflow skill
- **AND** the page shows a primary install or create command

#### Scenario: visitor reviews available workflows

- **WHEN** a visitor scans the workflow section
- **THEN** the page shows workflow cards for OpenSpec delivery, release review,
  real engineering, and product development
- **AND** each card shows the callable entry skill and its related skill steps

### Requirement: Landing Content Matches Current CLI Surface

The landing page SHALL teach the current root-first Omniskill command
surface.

#### Scenario: visitor copies a command

- **WHEN** the page shows install, clone, list, init, validate, or deps examples
- **THEN** those examples use the current root command surface
- **AND** the page does not advertise removed nested `omniskill`
  subcommands or paused Pony Trail history/revert/prehook commands

### Requirement: Source Attribution Is Preserved

The landing folder SHALL preserve attribution for the downloaded Figma export.

#### Scenario: maintainer audits the landing source

- **WHEN** a maintainer opens the landing folder
- **THEN** it includes attribution to the original "Create Omniskill
  Workflows" Figma design export
- **AND** the attribution does not imply the exported Vite project remains the
  runtime architecture
