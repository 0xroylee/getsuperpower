# Omniskill Landing Header Stars Spec

## ADDED Requirements

### Requirement: Header GitHub Link Shows Repository Stars

The landing page SHALL show the Omniskill repository star signal in the
header GitHub link.

#### Scenario: visitor sees available GitHub stars

- **WHEN** GitHub repository metadata is available to the landing app
- **THEN** the header GitHub link shows the GitHub icon
- **AND** the header GitHub link shows a compact star-count label
- **AND** the header GitHub link targets `https://github.com/devos-ing/omni-skills`

#### Scenario: GitHub metadata is unavailable

- **WHEN** GitHub repository metadata cannot be fetched
- **THEN** the landing page still renders the header GitHub link
- **AND** the header GitHub link targets `https://github.com/devos-ing/omni-skills`
- **AND** the header GitHub link shows stable fallback text instead of a broken
  or empty star label

### Requirement: Header Stars Use Server-Side Cached Metadata

The landing app SHALL fetch repository star metadata from the server entrypoint
instead of adding client-side loading behavior to the header.

#### Scenario: developer inspects the landing header implementation

- **WHEN** a developer opens `landing/app/page.tsx`
- **THEN** the GitHub repository metadata fetch is declared in the server
  component layer
- **AND** the fetch uses Next.js caching
- **AND** the client `LandingPage` receives a formatted star label as a prop
- **AND** no new package dependency is required for star-count rendering
