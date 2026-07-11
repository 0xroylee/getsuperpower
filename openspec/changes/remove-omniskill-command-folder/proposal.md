# Proposal: Remove Omniskill Command Folder

## Summary

Fold the separate `omniskill-command/` package-shaped folder back into the
main Omniskill source tree. The project is now itself `omniskill`, so
the command registration module should live under `src/` instead of a side
package boundary.

## Motivation

The earlier root-level command package made sense while Omniskill was being
introduced inside the old Ponyrace project. After the public package and binary
rename, that extra folder is confusing: it suggests Omniskill is still a
dependency of the project instead of the project itself.

## Scope

In scope:

- Move the command module into `src/omniskill.ts`.
- Update `src/cli.ts` and tests to import from the new source module.
- Remove `omniskill-command/index.ts` and `omniskill-command/package.json`.
- Update docs and AGENTS guidance that still describes the old folder.
- Preserve root `omniskill install/clone/deps/init/validate/list` behavior.
- Preserve compatibility aliases.

Out of scope:

- Migrating existing legacy local state directories; current runtime state lives
  under `.omniskill/`.
- Renaming `pony-trail`.
- Renaming the internal `src/runtimes/ponytrail/` folder.

## Acceptance Criteria

- No `omniskill-command/` folder remains.
- `src/cli.ts` imports Omniskill command helpers from `src/`.
- Tests no longer read `omniskill-command/package.json`.
- Root Omniskill command smoke tests still pass.
- `rtk bun run check` passes.
