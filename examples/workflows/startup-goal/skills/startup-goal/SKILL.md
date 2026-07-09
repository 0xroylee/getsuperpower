---
name: startup-goal
description: "Use when coordinating a startup goal across CEO, CTO, product manager, engineering manager, founding engineer, and QA lead role subagents."
---

# Startup Goal

Use this role when the user wants to move a startup goal through a realistic
operating workflow rather than ask one specialist. Your job is to coordinate the
right role subagents, keep handoffs explicit, and combine the finished role
outputs into one owner-facing result.

This entry skill normally runs after `superpowers:brainstorming` has produced an
approved requirement brief. If the user invokes `$startup-goal` directly with a
raw requirement instead, treat that requirement as a starting hypothesis rather
than an approved brief. Run the requirement intake loop before dispatching any
role subagents: ask one question at a time until you have no material open
questions or ambiguities, then present the brief and wait for explicit approval.

## Requirement Intake Loop

- Treat a raw user requirement as incomplete until you have checked it for
  missing context, hidden constraints, and ambiguous success criteria.
- Ask exactly one concise question at a time unless the user explicitly asks for
  a checklist or full interview.
- After each answer, update your internal brief and choose the next highest-risk
  unknown. If several facts are missing, ask about the one most likely to change
  routing, scope, or execution risk.
- Keep interviewing until the startup goal, target customer, problem or
  opportunity, constraints, non-goals, success criteria, current context or
  artifacts, verification bar, and needed roles are clear enough to process
  without open questions or ambiguity.
- If the user says `run it`, `process`, `continue`, or gives another short
  approval while material ambiguity remains, ask the next highest-value question
  instead of routing the work.
- When there are no remaining material questions, present an approval-ready
  requirement brief with goal, customer, problem, scope, non-goals, constraints,
  success criteria, roles needed, assumptions, and approval gates.
- Only after the user explicitly approves that brief may you process the goal
  through role routing and subagent dispatch.

## Lazy Routing Gate

- Prefer the cheapest safe path before implementation. Think just enough to avoid
  dumb work, then route only the next decision or slice.
- Do not dispatch every role by default. Choose the smallest role set that can
  answer the current decision, remove meaningful uncertainty, or safely move the
  goal forward.
- Default to one or two roles for implementation-shaped goals: usually
  `founding-engineer` for the change and `qa-lead` for verification. Add
  `product-manager` only when user value or scope is unclear, `cto` only when
  architecture or dependency risk is real, `engineering-manager` only when
  sequencing or release coordination matters, and `ceo` only when company-level
  tradeoffs are involved.
- If a goal is tiny, obvious, and reversible, keep the visible processing but
  use the narrow implementation path after the approved brief.
- If a goal has company, product, architecture, delivery, implementation, and QA
  uncertainty, use the full role bench. Otherwise, keep the bench lazy.
- In the role plan, name the roles you are intentionally skipping and why, so the
  owner can see that the omission is deliberate.

## Visible Processing Contract

Never make the lazy path invisible. Lazy routing controls how many roles are
needed; it does not remove the visible workflow. Even for a one-role or two-role
slice, show the processing trace before, during, and after execution.

Every processed goal must include:

- Processing plan: the approved brief status, selected roles, skipped roles, and
  the reason this route is the smallest safe route.
- Active roles: each role currently being processed, its responsibility, and the
  expected output.
- Skipped roles: each omitted bundled role and the reason it is unnecessary for
  this slice.
- Completed role outputs: each role result, the accountable role, verification
  evidence, and any handoff to the next role.
- Unavailable dispatch: if subagent dispatch is unavailable, still show the
  prepared role briefs and explicitly stop instead of blending the role work into
  an unlabelled direct answer.

## Bundled Roles

- `ceo` for company direction and tradeoffs.
- `product-manager` for customer value, PRDs, and issue slicing.
- `cto` for architecture and technical risk.
- `engineering-manager` for execution sequencing and quality gates.
- `founding-engineer` for implementation.
- `qa-lead` for acceptance and release verification.

## Operating Mode

1. Confirm there is an approved requirement brief for the startup goal.
2. If the brief is missing or the user supplied only a raw requirement, run the
   requirement intake loop until no material question or unclear point remains.
3. Present the approval-ready requirement brief and wait for explicit human
   approval before continuing.
4. Run the lazy routing gate and decide the smallest role set needed for the
   approved brief.
5. Present the role plan, including skipped roles and why they are unnecessary
   for this slice, then wait at any human approval gate.
6. Show the visible processing plan with active roles, skipped roles, expected
   outputs, and verification expectations.
7. Dispatch a separate role-scoped subagent for each needed role.
8. Give each subagent the matching role skill as its operating instruction.
9. Give each subagent a compact brief containing the startup goal, current
   decision or task, prior handoff context, expected output, approval gate, and
   verification expectation.
10. Wait for all dispatched role subagents to finish.
11. Show completed role outputs before combining them.
12. Combine the role outputs into one owner-facing decision log.
13. Name which role is accountable for each decision.
14. Recommend the next action from the combined result.
15. Stop at human approval gates before advancing to the next role or phase.

If the runtime cannot dispatch subagents, stop and tell the user which role
briefs are ready to send rather than blending all role work into one answer.
