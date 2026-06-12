import { describe, expect, it, mock } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { AgentAdapter, AgentAdapterRunRequest } from "adapters";
import type { ResolvedProjectConfig, RunState } from "../src/features/types";
import { handleImplementingStage } from "../src/features/workflow/implementation/implement-stage";
import type {
	WorkflowRuntime,
	WorkflowTaskClient,
} from "../src/features/workflow/types/workflow.types";

describe("implementation sub-agents", () => {
	it("merges child worktree branches before creating the parent draft PR", async () => {
		const workspacePath = await mkdtemp(
			path.join(os.tmpdir(), "devos-implementation-subagents-"),
		);
		const events: string[] = [];
		const config = createProject(workspacePath);
		const state = createRunState(workspacePath);
		const childWorktreeBase = path.join(
			workspacePath,
			".devos",
			"projects",
			"default",
			"subagents",
			"wor-56",
			"ui-",
		);
		const parentAgent = createAgent("parent should not run", events);
		const childAgent = createAgent(
			"UI task completed",
			events,
			"child-session",
		);
		const runtime = createRuntime({
			events,
			childAgent,
			childWorktreeBase,
		});
		const taskClient = createTaskClient();

		await handleImplementingStage(
			config,
			parentAgent,
			taskClient,
			state,
			runtime,
		);

		expect(events[0]).toBe("prepare:WOR-56");
		expect(events[1]).toMatch(/^ensure:codex\/wor-56-subagent-ui-[0-9a-z]+$/);
		expect(events[2]).toBe("agent:child-session");
		expect(events[3]).toBe("commit:ui");
		expect(events[4]).toBe(events[1].replace("ensure:", "merge:"));
		expect(events[5]).toBe("publish-pr:WOR-56");
		expect(events).toHaveLength(6);
		expect(parentAgent.runAgent).not.toHaveBeenCalled();
		expect(runtime.createAgentAdapter).toHaveBeenCalledTimes(1);
		expect(state.implementationSummary).toContain("UI task completed");
		expect(state.implementationSubAgents).toEqual([
			expect.objectContaining({
				id: "ui",
				status: "merged",
				branch: expect.stringMatching(/^codex\/wor-56-subagent-ui-[0-9a-z]+$/),
				worktreePath: expect.stringMatching(/ui-[0-9a-z]+$/),
				sessionId: "child-session",
				summary: "UI task completed",
			}),
		]);
		expect(state.pullRequest?.url).toBe("https://example.test/pr/56");
		expect(state.stage).toBe("in_review");
	});
});

function createAgent(
	finalMessage: string,
	events: string[],
	sessionId?: string,
): AgentAdapter {
	return {
		runAgent: mock(async (request: AgentAdapterRunRequest) => {
			expect(request.role).toBe("implementing");
			events.push(`agent:${sessionId ?? "parent"}`);
			return {
				finalMessage,
				stdout: "",
				sessionId,
				usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
			};
		}),
		runPlan: mock(async () => {
			throw new Error("runPlan should not be called");
		}),
		runTaskIntake: mock(async () => {
			throw new Error("runTaskIntake should not be called");
		}),
		resume: mock(async () => {
			throw new Error("resume should not be called");
		}),
		runReview: mock(async () => {
			throw new Error("runReview should not be called");
		}),
		runGithubComment: mock(async () => {
			throw new Error("runGithubComment should not be called");
		}),
	};
}

function createProject(workspacePath: string): ResolvedProjectConfig {
	return {
		id: "default",
		name: "default",
		workspacePath,
		executionPath: workspacePath,
		repo: { owner: "acme", name: "repo", baseBranch: "main" },
		github: { useGhCli: true, defaultBugLabel: "bug" },
		server: {
			database: {
				databasePath: path.join(workspacePath, ".devos", "config", "server-db"),
				port: 54329,
			},
		},
		codex: { binary: "codex", streamLogs: false },
		skills: {
			root: path.join(workspacePath, "skills"),
			brainstorm: path.join(workspacePath, "brainstorm.md"),
			plan: path.join(workspacePath, "plan.md"),
			implement: path.join(workspacePath, "implement.md"),
			reviewTest: path.join(workspacePath, "review.md"),
			githubComment: path.join(workspacePath, "github-comment.md"),
		},
		workflow: { issueConcurrency: 1 },
		dryRun: false,
	};
}

function createRunState(workspacePath: string): RunState {
	return {
		projectId: "default",
		projectName: "default",
		workspacePath,
		repository: { owner: "acme", name: "repo", baseBranch: "main" },
		issue: {
			id: "task_WOR-56",
			key: "WOR-56",
			title: "Add sub-agent support",
			url: "devos://tasks/WOR-56",
		},
		stage: "in_progress",
		codexSessionId: "parent-session",
		planSummary: [
			"SUCCESS_GOAL: Sub-agent code is merged before PR creation.",
			"IMPLEMENTATION_SUBAGENTS_JSON:",
			'[{"id":"ui","title":"Update UI","description":"Implement the UI slice","ownedPaths":["packages/web"],"verification":"bun test packages/web"}]',
		].join("\n"),
		bugs: [],
		startedAt: "2026-06-12T00:00:00.000Z",
		updatedAt: "2026-06-12T00:00:00.000Z",
	};
}

function createTaskClient(): WorkflowTaskClient {
	return {
		fetchWork: async () => [],
		fetchIssueByIdentifier: async () => null,
		fetchReviewOnlyWork: async () => [],
		isAssignedState: async () => true,
		markStage: async () => undefined,
		markCanceled: async () => undefined,
		createBacklogTask: async () => ({
			id: "task-1",
			identifier: "WOR-56",
			title: "parent",
			url: "devos://tasks/WOR-56",
		}),
		createTodoIssueFromPlan: async () => ({
			id: "task-2",
			identifier: "WOR-57",
			title: "child",
			url: "devos://tasks/WOR-57",
		}),
		applyStageLabel: async () => undefined,
		clearWorkflowStageLabels: async () => undefined,
		comment: async () => undefined,
		linkPullRequest: async () => undefined,
	};
}

function createRuntime(input: {
	events: string[];
	childAgent: AgentAdapter;
	childWorktreeBase: string;
}): WorkflowRuntime {
	return {
		createTaskClient: () => createTaskClient(),
		createAgentAdapter: mock((config: ResolvedProjectConfig) => {
			expect(config.executionPath.startsWith(input.childWorktreeBase)).toBe(
				true,
			);
			return input.childAgent;
		}),
		ensureBaseBranchFresh: async () => undefined,
		ensureIssueWorktree: async () => "",
		prepareWorktreeDependencies: async () => undefined,
		removeIssueWorktree: async () => ({ removed: false }),
		findOpenPullRequestForIssue: async () => undefined,
		getPullRequestMergeStatus: async () => ({}),
		prepareImplementationBranch: mock(async (_config, issueKey) => {
			input.events.push(`prepare:${issueKey}`);
			return "codex/wor-56";
		}),
		ensureImplementationSubAgentWorktree: mock(async (_config, details) => {
			input.events.push(`ensure:${details.branch}`);
		}),
		commitImplementationSubAgentWorktree: mock(async (_config, details) => {
			input.events.push(`commit:${details.taskId}`);
			return true;
		}),
		mergeImplementationSubAgentBranch: mock(async (_config, branch) => {
			input.events.push(`merge:${branch}`);
		}),
		createDraftPrFromWorktree: mock(async () => {
			throw new Error("staged-change PR creation should not run");
		}),
		createDraftPrFromPublishedBranch: mock(async (_config, issueKey) => {
			input.events.push(`publish-pr:${issueKey}`);
			return {
				branch: "codex/wor-56",
				title: "[codex] WOR-56: Add sub-agent support",
				url: "https://example.test/pr/56",
			};
		}),
		updateDraftPrFromWorktree: async () => true,
		pushImplementationBranch: async () => undefined,
		commentOnPr: async () => undefined,
		markPrReadyForReview: async () => true,
		squashMergePullRequest: async () => true,
		sendTaskOutcomeEmail: async () => undefined,
		sendHumanReviewRequiredEmail: async () => undefined,
	};
}
