# Superpowers Writing-Plans Onboarding Design

## Context

Ponyrace's bundled `/ponyrace` skill requires two Superpowers process gates
before implementation:

- `superpowers:brainstorming`
- `superpowers:writing-plans`

The CLI already tries to install `superpowers:brainstorming` during `onboard`
and `setup` when the Superpowers plugin cache is available. If brainstorming is
missing, Ponyrace prints a command the user can run later. It does not yet do
the same for `superpowers:writing-plans`, even though the Ponyrace skill invokes
that skill after requirement-direction approval.

The upstream `obra/superpowers` workflow describes `brainstorming` and
`writing-plans` as adjacent early workflow skills: design first, then a detailed
implementation plan. Ponyrace should help users install both required gates
instead of leaving the second one to fail at runtime.

## Goals

- Make `ponyrace onboard` and `ponyrace setup` attempt to install both required
  Superpowers process skills when available locally.
- Support the command-line helper:
  `ponyrace skills install superpowers:writing-plans --agents codex,claude,cursor --home ~`.
- Keep Superpowers as the source of truth. Ponyrace should copy skills from an
  installed Superpowers plugin cache, not bundle its own fork of the skills.
- Print actionable missing-skill commands for each unavailable Superpowers
  skill.
- Update tests so onboarding/setup and direct `skills install` cover both
  `superpowers:brainstorming` and `superpowers:writing-plans`.

## Non-Goals

- Do not vendor or rewrite Superpowers skill contents into `bundled-skills/`.
- Do not require Superpowers installation for Ponyrace's core CLI commands to
  run. Missing Superpowers process skills should remain a warning with a command
  to fix it.
- Do not add network fetching from GitHub during onboarding. The CLI should only
  install from local plugin cache or tell the user what to install.
- Do not change Ponyrace's requirement-court voting, worker adapters, or
  implementation gates.

## Design

### Skill Installer

Generalize the current special case for `superpowers:brainstorming` into a
small source registry for supported Superpowers process skills:

- `superpowers:brainstorming`
  - cache folder: `brainstorming`
  - install name: `superpowers-brainstorming`
- `superpowers:writing-plans`
  - cache folder: `writing-plans`
  - install name: `superpowers-writing-plans`

Both sources should search the same plugin-cache roots:

- `.codex/plugins/cache/openai-curated/superpowers/*/skills/<folder>`
- `.codex/plugins/cache/openai-curated-remote/superpowers/*/skills/<folder>`
- `.codex/plugins/cache/openai-bundled/superpowers/*/skills/<folder>`

If the skill folder is not found, throw a missing-Superpowers-skill error that
includes the exact install command for that source.

### Onboarding And Setup

Replace the single optional brainstorming install helper with a helper that
iterates over the required Superpowers process skill sources:

- `superpowers:brainstorming`
- `superpowers:writing-plans`

For each source:

1. Try to resolve it from the local plugin cache.
2. If found, install it through the existing `installSkillWithLocalHistory()`
   path with `refreshExisting: true`.
3. If missing, store a missing-skill item with an exact command using the
   selected `--agents` and `--home` values.
4. Print install results for found skills the same way the current onboarding
   prints optional brainstorming results.

`printPonyraceReady()` should summarize missing Superpowers skills as optional
process support. The wording should make clear that Ponyrace can still run, but
the full `/ponyrace` skill workflow needs the missing skills installed and the
agent app restarted.

### Direct Skill Install

`ponyrace skills install superpowers:writing-plans` should behave like
`superpowers:brainstorming`:

- copy to directory targets such as `.agents/skills/superpowers-writing-plans`
- mirror Codex installs to `.codex/skills/superpowers-writing-plans`
- render Cursor rules as `.cursor/rules/superpowers-writing-plans.mdc`
- support `update`, `dry-run`, and target status reporting through the existing
  installer machinery

### Bundled Ponyrace Skill

Update `bundled-skills/ponyrace/SKILL.md` so the missing-skill fallback no
longer mentions only brainstorming. It should tell the user to install whichever
required Superpowers skill is missing, including the new writing-plans command.
Installed copies should still be refreshed through `ponyrace skills update` or
reinstall; do not edit installed copies directly.

## Testing

- Add test helpers that create fake Superpowers plugin-cache skills for both
  `brainstorming` and `writing-plans`.
- Add installer tests for:
  - resolving `superpowers:writing-plans`
  - missing `superpowers:writing-plans` error text
  - installing `superpowers:writing-plans` into Codex and Cursor targets
- Update onboarding/setup CLI tests so a cache with both skills installs both.
- Update missing-Superpowers CLI tests so missing output includes both install
  commands.
- Update bundled `ponyrace` skill tests so it mentions both Superpowers gates
  and both command-line install helpers.
- Run `rtk bun run check`.
- Smoke `onboard` in a scratch workspace with a local fake Superpowers cache
  and verify both installed skill folders exist.

## Risks

- Naming drift: keep source names colon-scoped and install folder names
  hyphen-case, matching the existing brainstorming behavior.
- Overpromising: missing Superpowers skills should remain optional warnings for
  the CLI, because not every shell user invokes the `/ponyrace` skill workflow.
- Cache layout drift: keep the lookup small and aligned with the existing
  plugin-cache search roots. Do not fetch from the network during onboarding.
- Dirty worktree risk: commit only files related to this feature; leave existing
  unrelated local edits unstaged unless the user explicitly asks otherwise.
