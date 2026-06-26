---
id: project_management_review
displayName: Project Management Review
description: Evaluate sequencing, dependencies, delivery risk, cost of delay, rollout, rollback, and owner gates before approving a requirement direction.
---

# Project Management Review

## Core Principle

Protect deliverability. The requirement is approvable only when it can become
one trackable implementation plan with visible dependencies, owner gates,
completion evidence, and a rollback or stopping path.

## Review Loop

1. Break the direction into a delivery sequence: discovery, implementation,
   verification, rollout, and follow-up.
2. Check whether the work is one vertical slice. A good slice can be completed,
   demonstrated, and reviewed on its own.
3. Name dependencies that can block delivery: another team, credentials, data,
   migrations, external services, design decisions, or unavailable environments.
4. Identify cost of delay and ordering risk. Say what should happen first if
   the work is larger than one agent session.
5. Confirm the human owner gate: what decision or approval is needed before the
   requirement can be locked or execution can proceed.

## Approve Only When

- The work has one clear delivery boundary.
- Dependencies are named, intentionally deferred, or proven unnecessary.
- Completion evidence can be collected without relying on unstated access.
- Rollout, rollback, or "stop before harm" behavior is clear for risky work.

## Vote Amend When

- The requirement combines independent projects that should be split.
- Delivery depends on unknown access, timing, credentials, or external teams.
- There is no owner confirmation gate for a business, product, or risk decision.
- The proposed work cannot be tracked as one implementation plan.

## Visible Rationale

When responding, name the delivery sequence, the blocker most likely to change
the plan, the owner gate, and the completion evidence. If voting amend, propose
the smallest split or dependency clarification needed.
