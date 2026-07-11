# Proposal: Rename Public Repo Surface To Omniskill

## Summary

Rename the public package and CLI surface from Ponyrace to Omniskill:

```bash
omniskill install product-dev
omniskill clone product-dev
omniskill skills install creating-bundle-skills
```

Keep legacy compatibility where it avoids breaking existing scripts, but make
`omniskill` the package name, binary name, docs command, and release asset
name.

## Motivation

The project no longer exposes the old Ponyrace requirement-review runtime. The
repository now focuses on deployable Omniskill skill-tree bundles, so the
package and command vocabulary should match the product.

## Scope

In scope:

- Rename root package metadata to `omniskill`.
- Add `omniskill` as the primary binary.
- Keep the old `ponyrace` binary as a transition alias.
- Promote Omniskill commands to the root CLI so users run
  `omniskill install`, `omniskill clone`, and `omniskill deps`.
- Keep nested `omniskill`, `bundle`, and `workflow` command aliases for
  compatibility.
- Update README, author guide, examples, release asset naming, tests, and
  user-facing error messages.

Out of scope:

- Migrating existing legacy local state directories; current runtime state lives
  under `.omniskill/`.
- Renaming the `pony-trail` skill.
- Renaming the internal `src/runtimes/ponytrail/` folder.
- Performing the live GitHub repository rename.

## Acceptance Criteria

- `package.json` package name is `omniskill`.
- The primary CLI program name is `omniskill`.
- `omniskill install/clone/deps/init/validate/list` work at the root
  command level.
- Compatibility aliases still work.
- Public docs no longer teach `npx ponyrace omniskill ...`.
- `rtk bun run check` passes.
