# Proposal: Create Next.js Landing Folder

## Summary

Create a repo-root `landing/` app for the Omniskill marketing surface,
adapted from the Figma/Vite export at
`/Users/roy/Downloads/Create Omniskill Workflows/`.

The landing app should use Next.js 16 and Tailwind CSS, preserve the current
workflow-bundle story, and stay separate from the Bun CLI package so website
dependencies do not affect CLI publishing or tests.

## Motivation

The downloaded design already explains the product direction: one command
installs a whole AI-agent workflow, with examples for OpenSpec delivery, release
review, real engineering, and product development.

The export is currently a Vite React app. This repository needs a clean landing
folder that fits a modern Next.js app structure and can evolve independently
from the CLI runtime.

## Scope

In scope:

- Create a root `landing/` folder.
- Port the downloaded React landing page into a Next.js 16 app structure.
- Use Tailwind CSS for styling and keep the page responsive.
- Keep app dependencies isolated inside `landing/package.json`.
- Preserve source attribution for the Figma export.
- Update repo docs only where needed to explain how to run the landing app.
- Add focused verification for build/lint/type checks available in the landing
  app.

Out of scope:

- Changing Omniskill CLI behavior.
- Moving the Bun CLI package into a monorepo package layout.
- Adding hosted deployment configuration.
- Adding analytics, auth, registry browsing, or backend APIs.
- Rewriting the visual direction beyond the changes needed for a solid Next.js
  and Tailwind implementation.

## Proposed Design Direction

Add `landing/` as an isolated Next.js app:

```text
landing/
  app/
    globals.css
    layout.tsx
    page.tsx
  components/
  package.json
  postcss.config.mjs
  tsconfig.json
```

Keep the page mostly static and data-driven. Workflow cards, command examples,
and agent badges should live in small typed arrays near the page or in a local
data module. Components should stay presentation-focused and avoid reaching into
CLI source files.

Use the downloaded export as the content and layout baseline, then adapt it for
Next.js conventions:

- replace the Vite entrypoint with `app/page.tsx`;
- move global CSS into `app/globals.css`;
- remove Vite-only config;
- keep Tailwind CSS imports compatible with the selected Tailwind setup;
- keep commands aligned with the repo's root-first CLI surface.

## Acceptance Criteria

- `landing/` contains a runnable Next.js 16 app.
- The landing app uses Tailwind CSS for page styling.
- The page renders Omniskill as the first-viewport product signal.
- The page includes the workflow cards and install/create/validate command
  examples from the downloaded export, updated to the current root-first CLI
  story.
- The app can be installed and checked from inside `landing/` without changing
  root package dependencies.
- The source attribution from the downloaded export is preserved in the landing
  folder.
- Root CLI behavior and existing tests remain unchanged.
- `rtk bun run check` passes before delivery.

## Open Questions For Review

- Should `landing/` use npm, pnpm, or Bun scripts as its local package manager
  convention?
- Should the first pass keep the dark visual direction from the export, or do
  you want a brighter public marketing look before implementation?
- Should the landing page link to `devos-ing/omni-skills` or the current
  repository remote if those differ?
