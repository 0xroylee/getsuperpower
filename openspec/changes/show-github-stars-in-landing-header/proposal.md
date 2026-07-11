# Proposal: Show GitHub Stars In Landing Header

## Summary

Update the landing page header GitHub link so it shows the repository star count
next to the GitHub icon.

The header should continue to link to
`https://github.com/devos-ing/omni-skills`, but it should make the project
signal visible without asking visitors to leave the landing page first.

## Motivation

The landing page already uses the header as a lightweight navigation surface and
links to the GitHub repository. Showing stars there gives technical visitors a
quick trust cue while keeping the main hero focused on the Omniskill value
proposition.

The change should be small and resilient: a GitHub metadata failure should not
break the landing page or replace the header with a loading state.

## Scope

In scope:

- Fetch the Omniskill repository star count from GitHub in the landing app.
- Pass the star label into the client landing page header.
- Render the GitHub header link with the GitHub icon and star label.
- Keep the header accessible on desktop and mobile.
- Fall back to a stable non-count label when GitHub metadata is unavailable.
- Add focused source-contract coverage for the header star behavior.

Out of scope:

- Adding a new API route, database, analytics event, or registry service.
- Fetching workflow manifests dynamically from GitHub.
- Changing workflow cards, workflow detail panels, or CLI behavior.
- Adding a new dependency.
- Redesigning the landing page visual direction.
- Publishing or deploying the landing app.

## Proposed Design Direction

Use the existing `landing/app/page.tsx` server entrypoint to fetch GitHub
repository metadata with Next.js fetch caching, format `stargazers_count` into a
short label, and pass that label to `LandingPage`.

`LandingPage` remains the client component that owns interactive workflow state.
Its header GitHub anchor receives a `githubStarsLabel` prop and renders it next
to the GitHub icon. If the fetch fails, the server entrypoint passes a fallback
label such as `Stars`, so the header remains stable and the link still works.

The first implementation should keep the UI compact: icon plus `1.2k stars`
style label on wider screens, with no layout shift or oversized badge treatment.

## Acceptance Criteria

- The header GitHub link still targets `https://github.com/devos-ing/omni-skills`.
- The header GitHub link shows a star-count label when GitHub metadata is
  available.
- The landing page still renders a useful GitHub header link when GitHub
  metadata is unavailable.
- The GitHub metadata fetch is server-side and cached by Next.js.
- No new package dependency is added.
- Existing workflow-card and workflow-run landing behavior remains unchanged.
- Focused landing source-contract tests cover the star label path and fallback.
- `rtk bun test tests/landing-app.test.ts` passes before delivery.
- `rtk bun run check` passes before delivery.
- A landing app build or smoke check passes before delivery.

## Open Questions For Review

- Should the fallback text be `Stars`, `GitHub`, or `Star on GitHub`?
- Should the compact label format use `1.2k stars` or GitHub's exact integer
  count?
