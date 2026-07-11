# Proposal: Omniskill Install/Clone Bundle Skill Sets

## Summary

Make the public Omniskill command language center on deployable bundle skill
sets:

```bash
omniskill install <bundle-skills-set-name-or-source>
omniskill clone <bundle-skills-set-name-or-source>
```

`install` stays the stable existing command. `clone` becomes the friendly command
for people discovering, copying, or deploying a workflow bundle skills set from a
built-in name, local path, or shareable source. Both verbs install the same
skills and record the same workflow metadata.

## Motivation

The project is now focused on Omniskill bundle skills rather than the older
Ponyrace requirement-review runtime. The command vocabulary should make that
product boundary obvious:

- A Omniskill is a bundle skills set / workflow.
- Anyone can author and deploy their own bundle skills set.
- Users should not need to learn legacy `workflow` or `bundle` commands first.
- `clone` should feel natural when the bundle comes from another person or repo.

## Scope

In scope:

- Add `omniskill clone <source>` as a first-class command or documented alias
  of `omniskill install <source>`.
- Update help, README, examples, author guide, and tests to teach
  `omniskill install/clone <bundle skills set name>`.
- Keep `omniskill install` compatible.
- Keep `bundle` and `workflow` compatibility aliases only as transitional
  backwards-compatible surfaces.
- Preserve automatic dependency installation for external skill packages such as
  `mattpocock:*`.

Out of scope:

- A hosted registry service.
- Fully automatic publication to GitHub/npm.
- Removing the existing package/binary name in this change.
- Reintroducing Ponyrace requirement-review runtime commands.

## Proposed Command Model

| Command | Meaning |
| --- | --- |
| `omniskill install product-dev` | Install a bundled first-party workflow by name. |
| `omniskill clone product-dev` | Same behavior, friendlier verb for copying/deploying a bundle skills set. |
| `omniskill install ./my-workflow` | Install a local author-created bundle. |
| `omniskill clone ./my-workflow` | Same behavior for a local/shared bundle source. |
| `omniskill deps <source>` | Inspect bundle skill dependencies before install/clone. |
| `omniskill init <name>` | Create an authorable bundle skills set. |
| `omniskill validate <source>` | Validate a bundle skills set before sharing. |

## Approved Decisions

- `clone` has the same behavior as `install`; it is an alternate public verb,
  not a separate local-copy operation.
- The public phrase is **Omniskill**. Supporting copy may explain that a
  Omniskill is a deployable bundle skills set / workflow, but command docs
  should lead with Omniskill.

## Acceptance Criteria

- `omniskill clone <source>` installs the same skills and workflow record as
  `omniskill install <source>`.
- CLI help presents `install` and `clone` under `omniskill`.
- Documentation describes Omniskill as a deployable "bundle skills set
  (workflow)" that any author can create and share.
- Existing `omniskill install`, `bundle`, and `workflow` tests continue to
  pass.
- `rtk bun run check` passes.

## Closed Questions

- `clone` output can reuse the existing install result copy because clone and
  install are the same operation.
- Docs should use **Omniskill** as the main public phrase.
