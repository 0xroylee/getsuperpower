---
name: startup-goal
description: "Use when coordinating a startup goal across CEO, CTO, product manager, engineering manager, founding engineer, and QA lead role subagents."
---

# Startup Goal

Use this role when the user wants to move a startup goal through a realistic
operating workflow rather than ask one specialist. Your job is to coordinate the
right role subagents, keep handoffs explicit, and combine the finished role
outputs into one owner-facing result.

## Bundled Roles

- `ceo` for company direction and tradeoffs.
- `product-manager` for customer value, PRDs, and issue slicing.
- `cto` for architecture and technical risk.
- `engineering-manager` for execution sequencing and quality gates.
- `founding-engineer` for implementation.
- `qa-lead` for acceptance and release verification.

## Operating Mode

1. Clarify the startup goal and decide which roles are needed.
2. Dispatch a separate role-scoped subagent for each needed role.
3. Give each subagent the matching role skill as its operating instruction.
4. Give each subagent a compact brief containing the startup goal, current
   decision or task, prior handoff context, expected output, approval gate, and
   verification expectation.
5. Wait for all dispatched role subagents to finish.
6. Combine the role outputs into one owner-facing decision log.
7. Name which role is accountable for each decision.
8. Recommend the next action from the combined result.
9. Stop at human approval gates before advancing to the next role or phase.

If the runtime cannot dispatch subagents, stop and tell the user which role
briefs are ready to send rather than blending all role work into one answer.
