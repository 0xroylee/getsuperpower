# Proposal: Rename Startup Team To Startup Goal

## Summary

Rename the bundled `startup-team` workflow to `startup-goal` and make the entry
skill describe itself as a goal router that dispatches role-specific subagents.

The workflow should still install the same role bench: CEO, CTO, product
manager, engineering manager, founding engineer, and QA lead. The public entry
point should shift from a team metaphor to a goal-oriented workflow that calls
the right role skill in a separate subagent when that role is needed.

## Motivation

`startup-team` currently reads like a bundle of roles, but the actual user job is
to advance a startup goal. The current entry skill also tells one agent session
to name accountable roles and pass handoffs, which leaves the role separation
mostly conceptual.

Renaming the workflow to `startup-goal` makes the invocation match the user
intent: "help me move this startup goal forward." Updating the entry skill to
dispatch different role subagents turns the role workflow into a concrete
orchestration contract: each role gets its own context, skill instructions, and
handoff summary instead of being flattened into one agent voice.

## Scope

In scope:

- Rename the bundled workflow directory from `examples/workflows/startup-team`
  to `examples/workflows/startup-goal`.
- Rename the entry skill from `startup-team` to `startup-goal`.
- Update workflow manifest, lock file, README, AGENTS guidance, architecture or
  author docs, landing content, and tests that expose the old public name.
- Preserve the existing role workflow set: CEO, CTO, Product Manager,
  Engineering Manager, Founding Engineer, and QA Lead.
- Update the entry skill instructions so the workflow calls separate subagents
  with the relevant role skill instead of treating all role work as one inline
  checklist.
- Add or update tests that prove curated workflow loading, README content, and
  landing content use `startup-goal` and no longer teach `startup-team` as the
  current public alias.
- Verify with focused tests and the repo `rtk bun run check` gate.

Out of scope:

- Renaming the individual role skills such as `ceo`, `cto`, or
  `product-manager`.
- Adding a live subagent runtime to the GetSuperpower CLI.
- Changing external Skills CLI bootstrap behavior.
- Removing historical OpenSpec records that mention `startup-team`.
- Publishing a release, pushing a branch, or opening a pull request.

## Current Source Findings

- `examples/workflows/startup-team/workflow.json` uses `name:
  "startup-team"` and declares `./skills/startup-team` as the entry skill.
- `examples/workflows/startup-team/skills/startup-team/SKILL.md` currently
  routes roles inside one agent session by naming the accountable role and
  passing concise handoff context.
- `README.md`, `AGENTS.md`, `docs/workflow-author-guide.md`,
  `landing/lib/landing-content.ts`, and tests expose `startup-team` as the
  current public workflow alias.
- `tests/workflow-bundles.test.ts` treats `startup-team` as one of the curated
  workflow examples with checked lock files.
- `tests/readme.test.ts` and `tests/landing-app.test.ts` assert visible
  `startup-team` commands and landing source links.
- Historical OpenSpec change records also mention `startup-team`; those should
  remain historical evidence rather than be rewritten.

## Proposed Direction

Use `startup-goal` as the canonical public workflow alias and entry skill:

- Install: `npx getsuperpower@latest install startup-goal`
- Invoke: `$startup-goal help me launch this product from idea to shipped v1`
- Source path: `examples/workflows/startup-goal`

The entry skill should make role execution explicit:

1. Clarify the startup goal and identify which roles are actually needed.
2. Dispatch one fresh subagent per needed role with that role skill as the
   subagent's operating instructions.
3. Pass each subagent a compact brief: goal, current decision, prior handoff,
   expected output, approval gate, and verification expectation.
4. Merge role outputs into one owner-facing decision log.
5. Stop at human approval gates before advancing to the next role or phase.

## Acceptance Criteria

- `examples/workflows/startup-goal/workflow.json` has `name: "startup-goal"`.
- The workflow entry skill source is `./skills/startup-goal` and its frontmatter
  name is `startup-goal`.
- `workflow.lock.json` uses `workflow: "startup-goal"` and includes the renamed
  entry skill source and resolved name.
- Public docs and command examples use `startup-goal` for current install,
  dependency, lock, validate, remove, and invocation examples.
- Landing registry content labels the primary role workflow as Startup Goal,
  links to `examples/workflows/startup-goal`, and exposes
  `npx getsuperpower@latest install startup-goal`.
- Tests no longer assert current public `startup-team` commands except in
  historical OpenSpec fixtures or explicitly historical text.
- The startup-goal entry skill instructs agents to call separate subagents with
  role skill instructions for role work.
- The role skills remain available and keep their existing skill names.
- `rtk bun test tests/workflow-bundles.test.ts tests/readme.test.ts
  tests/landing-app.test.ts` passes.
- `rtk bun run check` passes before delivery, or any unrelated pre-existing
  failure is reported with evidence.
