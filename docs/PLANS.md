# Plans

Execution plans and plan artifacts are tracked under `docs/exec-plans/`.

## Workflow Plan Contract

Planning output should remain concise and implementation-focused, including:

1. scope summary
2. implementation steps
3. test plan
4. known risks

## Operating Commands

1. `bun run src/index.ts run --project default`
2. `bun run src/index.ts run --all-projects`
3. `bun run src/index.ts status --project default --issue ENG-123`
4. `bun run src/index.ts projects`

## Parallel Processing Operating Guidance

1. Use `--concurrency <N>` only when your project run can safely process multiple issue jobs in parallel.
2. If omitted, concurrency defaults to sequential issue processing (`1`).
3. Cron jobs can set the same bound with `run.concurrency`.
4. Per-issue leases prevent duplicate processing of the same issue key, but they do not serialize all repository mutations across separate ADHD.ai processes.

Safe usage patterns:

1. Shared `executionPath` in a single ADHD.ai process:
   use bounded concurrency with normal runs; execution-path locking serializes non-review-only issue execution in-process.
2. Shared `executionPath` across multiple ADHD.ai processes:
   prefer `--concurrency 1` per process or avoid this layout; process-local locks do not coordinate between processes.
3. Isolated worktrees or distinct `executionPath` per project/process:
   preferred for multi-project unattended automation, especially when parallel runs are expected.
4. Shared `workspacePath` state directories:
   ensure project IDs remain distinct and operator ownership is clear; per-issue leases are scoped by project run-state files.

## Hourly Review Automation Example

Use an hourly review-only automation job to re-run PR review/testing in parallel across resumable runs and squash-merge completed PRs whose complexity score is below the human approval threshold:

```ts
export default {
  automations: {
    jobs: [
      {
        id: "hourly-pr-review",
        schedule: { frequency: "hourly", every: 1, minute: 0 },
        run: { reviewOnly: true, allProjects: true },
      },
    ],
  },
};
```

Run it manually with:

1. `bun run review:hourly`
2. `bun run review:hourly:once`

Per-issue leases still prevent duplicate workers from processing the same issue concurrently.

If you add `run.concurrency` to review-only jobs, keep execution-path isolation in mind for any workflow that may still mutate local state or git metadata in your environment.

## Quality Commands

1. `bun run check`
2. `bun run typecheck`
3. `bun test`
