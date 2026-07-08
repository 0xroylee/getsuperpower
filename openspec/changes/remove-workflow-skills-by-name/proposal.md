# Proposal: Remove Workflow Skills By Name

## Summary

Add a GetSuperpower command that removes the skills installed for a named
workflow.

The command should be:

```bash
getsuperpower remove <workflow-name>
```

It should also be available through the compatibility workflow surface:

```bash
getsuperpower workflow remove <workflow-name>
```

The command removes the workflow's recorded skill artifacts from the selected
home directory, then removes the workflow record from `.getsuperpower/workflows`.

## Motivation

`getsuperpower install` creates agent skill files and writes a workflow record,
and `getsuperpower list` shows installed workflows. There is no matching command
to clean up the installed skills for one workflow.

That leaves users to manually inspect `.agents/skills`, `.codex/skills`,
`.claude/skills`, and `.cursor/rules`, which is risky because several workflows
can share the same skill dependency.

The remove command needs to be record-driven, not a string-guessing cleanup. It
should know which artifacts an install created and should keep shared artifacts
when another installed workflow still references them.

## Scope

In scope:

- Add `getsuperpower remove <workflow-name>`.
- Add `getsuperpower workflow remove <workflow-name>` as the compatibility
  alias.
- Support `--home <dir>` and `--dir <dir>` with the same default behavior as
  `install` and `list`: global home by default, project-local only when `--dir`
  is supplied.
- Support `--dry-run` so users can inspect the removal plan without deleting
  files.
- Support a non-interactive approval option for tests and automation.
- Persist enough install metadata in workflow records to remove exact skill
  artifacts later, including shared agent destinations and Codex mirror
  destinations.
- Remove only artifacts recorded for the named workflow, unless a legacy record
  has no artifact metadata.
- Preserve artifacts that are still referenced by another installed workflow
  record.
- Delete the named workflow record after a successful non-dry removal.
- Add a clear legacy fallback for older workflow records that do not include
  install artifact metadata.
- Add focused tests and a scratch-home smoke check.

Out of scope:

- Removing arbitrary individual skills without a workflow name.
- Removing external Skills CLI packages from the user's global Skills CLI
  cache.
- Removing Pony Trail snapshot history or loop run state.
- Adding a registry, UI, or hosted uninstall flow.
- Changing workflow manifest syntax.
- Reintroducing paused Pony Trail history, revert, or public prehook commands.

## Proposed Design Direction

Use the installed workflow record as the removal source of truth.

During `getsuperpower install`, extend the installed workflow record with a
removal metadata section. Each installed skill entry should record:

- manifest skill source, as written in `workflow.json`;
- resolved skill name from the installer;
- requested agent target;
- exact artifact paths that were written for that agent, including mirror
  destinations such as Codex's `.codex/skills/<skill>` copy;
- enough status metadata to distinguish an installed or updated artifact from a
  skipped one.

During `getsuperpower remove <workflow-name>`:

1. Resolve the workflow record root from `--dir` or `--home`.
2. Read `<root>/.getsuperpower/workflows/<workflow-name>.json`.
3. Build a removal plan from recorded artifact paths.
4. Compare that plan with the other installed workflow records in the same root.
5. Keep any artifact path still referenced by another workflow.
6. Print the plan.
7. Ask for confirmation unless a non-interactive approval flag is supplied.
8. Delete removable artifacts.
9. Delete the named workflow record.

For older records that have no artifact metadata, the command should enter a
plain legacy fallback:

- derive skill names from manifest sources where the mapping is unambiguous;
- report that the plan is inferred from a legacy record;
- require confirmation or the non-interactive approval flag;
- preserve paths referenced by other workflow records;
- if a skill source cannot be mapped safely, skip it and print a clear reason.

## Acceptance Criteria

- `getsuperpower remove <workflow-name> --home <scratch-home> --yes` removes the
  recorded skill artifacts for the named workflow and deletes that workflow's
  record.
- `getsuperpower workflow remove <workflow-name>` behaves the same as the root
  command.
- `getsuperpower remove <workflow-name> --dry-run` prints the removal plan
  without deleting skill artifacts or the workflow record.
- `getsuperpower remove <missing-workflow>` fails with a clear message that the
  workflow is not installed.
- A workflow install record written by the new CLI includes exact skill artifact
  metadata for later removal.
- Shared artifacts remain on disk when another installed workflow record still
  references them.
- Legacy workflow records without artifact metadata still produce a plain,
  explicit inferred plan for safely mappable skill names.
- Unmappable legacy skill sources are skipped with a clear message instead of
  being guessed.
- Root help and command registration tests include `remove`.
- Workflow compatibility help and command registration tests include
  `workflow remove`.
- `rtk bun run check` passes before delivery.

## Review Notes

Recommended command spelling is `remove` rather than `uninstall`, because the
user intent is "remove skills by workflow name" and the repo already uses plain
root-first verbs like `install`, `list`, and `deps`.

The non-interactive approval flag should be named `--yes` to match the existing
Skills CLI bootstrap style.
