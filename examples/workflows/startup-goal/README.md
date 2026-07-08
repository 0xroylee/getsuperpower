# Startup Goal GetSuperpower

Use this workflow when one agent session needs a realistic startup operating
bench organized around a goal. It installs role entry skills for CEO, CTO,
product manager, engineering manager, founding engineer, and QA lead, plus the
companion Superpowers and Matt Pocock skills those roles expect.

Install it from the repo root:

```bash
bun run dev -- install examples/workflows/startup-goal
```

Validate it while authoring:

```bash
bun run dev -- validate examples/workflows/startup-goal
```

Refresh the checked skill fingerprints after editing the bundled role skills:

```bash
bun run dev -- lock examples/workflows/startup-goal
```
