import { describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
	AgentAdapter,
	AgentAdapterRunRequest,
	AgentResult,
} from "adapters";
import type { ResolvedProjectConfig, RunState } from "../src/features/types";
import {
	runProjectHookScript,
	runProjectHookScriptSafely,
} from "../src/features/workflow/hooks/project-run-hooks";
import { createBuiltInWorkflowMetadata } from "../src/features/workflow/pipeline/built-in-workflow-metadata";
import { BuiltInWorkflowPhaseRunner } from "../src/features/workflow/pipeline/built-in-workflow-phase-runner";
import {
	IssuePipelineExecutor,
	resolvePipelineFailureError,
} from "../src/features/workflow/pipeline/issue-pipeline-executor";
import { PhaseRunner } from "../src/features/workflow/pipeline/phase-runner";
import { PipelineManager } from "../src/features/workflow/pipeline/pipeline-manager";
import type {
	CommandResult,
	RunCommandOptions,
} from "../src/utils/types/shell.types";

describe("workflow pipeline", () => {
	it("records skipped phases and stops when skip leaves the stage unchanged", async () => {
		let beforePhaseCalls = 0;
		const phaseRunner = new PhaseRunner({
			runAgent: async () => {
				throw new Error("phase runner should not execute skipped phases");
			},
		});
		const metadata = createBuiltInWorkflowMetadata(fakeProject());
		const pipeline = new PipelineManager(metadata, { phaseRunner });
		const state = fakeRunState("plan");

		const result = await pipeline.run({
			config: fakeProject(),
			state,
			shouldContinue: () => beforePhaseCalls < 2 && state.stage === "plan",
			beforePhase: async () => {
				beforePhaseCalls += 1;
				return "skip";
			},
		});

		expect(result.ok).toBe(true);
		expect(beforePhaseCalls).toBe(1);
		const planPhase = metadata.phases.find((phase) => phase.id === "plan");
		if (!planPhase) {
			throw new Error("Expected built-in metadata to include the plan phase");
		}
		expect(result.phaseResults).toEqual([
			{ status: "skipped", phase: planPhase },
		]);
	});

	it("dispatches built-in workflow phases through injected handlers", async () => {
		const events: string[] = [];
		const runner = new BuiltInWorkflowPhaseRunner({} as never, {
			plan: async ({ phaseId }) => {
				events.push(phaseId);
			},
			implement: async ({ phaseId }) => {
				events.push(phaseId);
			},
			testing: async ({ phaseId }) => {
				events.push(phaseId);
			},
		});
		const input = {
			config: fakeProject(),
			agent: fakeAgentAdapter(async () => ({
				finalMessage: "unused",
				stdout: "unused",
			})),
			notifications: fakeNotifications(),
			taskClient: fakeLinearClient(),
			state: fakeRunState("plan"),
		};

		await runner.run({ ...input, phaseId: "plan" });
		await runner.run({
			...input,
			phaseId: "implement",
			state: fakeRunState("in_progress"),
		});
		await runner.run({
			...input,
			phaseId: "testing",
			state: fakeRunState("in_review"),
		});

		expect(events).toEqual(["plan", "implement", "testing"]);
	});

	it("preserves rejected phase errors for downstream diagnostics", async () => {
		const diagnosticError = Object.assign(
			new Error("codex failed with exit code 1"),
			{
				backend: "codex",
				command: "codex",
				cwd: "/tmp/workspace",
				code: 1,
				stdout: '{"type":"error"}',
				stderr: "adapter stderr",
			},
		);
		const metadata = createBuiltInWorkflowMetadata(fakeProject());
		const phase = metadata.phases.find((candidate) => candidate.id === "plan");
		if (!phase) {
			throw new Error("Expected built-in metadata to include the plan phase");
		}
		const phaseRunner = new PhaseRunner({
			runAgent: async () => {
				throw diagnosticError;
			},
		});

		const result = await phaseRunner.run({
			config: fakeProject(),
			state: fakeRunState("plan"),
			phase,
			metadata,
		});

		expect(result.status).toBe("rejected");
		if (result.status !== "rejected") {
			throw new Error("Expected rejected phase result");
		}
		expect(result.error).toBe(diagnosticError);
		expect(
			resolvePipelineFailureError({ ok: false, phaseResults: [result] }),
		).toBe(diagnosticError);
	});

	it("runs project hook scripts through a temporary shell file", async () => {
		const calls: Array<{
			command: string;
			args: string[];
			options: RunCommandOptions;
			script: string;
		}> = [];

		await runProjectHookScript({
			config: fakeProject(),
			hookName: "pre",
			script: "echo setup\n",
			commandRunner: async (command, args, options) => {
				calls.push({
					command,
					args,
					options,
					script: await readFile(args[0] ?? "", "utf8"),
				});
				return successfulCommand();
			},
		});

		expect(calls).toHaveLength(1);
		expect(calls[0]?.command).toBe("sh");
		expect(calls[0]?.args).toHaveLength(1);
		expect(calls[0]?.options.cwd).toBe("/tmp/workspace");
		expect(calls[0]?.options.timeoutMs).toBeGreaterThan(0);
		expect(calls[0]?.script).toBe("echo setup\n");
	});

	it("throws pre-hook output when a project hook script fails", async () => {
		await expect(
			runProjectHookScript({
				config: fakeProject(),
				hookName: "pre",
				script: "exit 1",
				commandRunner: async () => ({
					code: 1,
					stdout: "setup stdout",
					stderr: "setup stderr",
				}),
			}),
		).rejects.toThrow("Project pre-hook failed: setup stderr");
	});

	it("records after-hook failures without throwing", async () => {
		const result = await runProjectHookScriptSafely({
			config: fakeProject(),
			hookName: "after",
			script: "exit 1",
			commandRunner: async () => ({
				code: 1,
				stdout: "",
				stderr: "post-run failed",
			}),
			loggerWarn: () => undefined,
		});

		expect(result).toEqual({
			status: "failed",
			error: "Project after-hook failed: post-run failed",
		});
	});

	it("runs the after-hook when the pre-hook blocks the workflow", async () => {
		const tempDir = await mkdtemp(path.join(os.tmpdir(), "devos-hooks-test-"));
		const markerPath = path.join(tempDir, "marker.txt");
		const config = {
			...fakeProject(),
			preHookScript: `echo pre >> "${markerPath}"\nexit 1\n`,
			afterHookScript: `echo after >> "${markerPath}"\n`,
		};
		const executor = new IssuePipelineExecutor(
			config,
			fakeNotifications(),
			fakeLinearClient() as never,
			{ reviewOnly: false } as never,
			"lease-owner",
			1000,
			{
				ensureBaseBranchFresh: async () => undefined,
				createAgentAdapter: () => {
					throw new Error("workflow pipeline should not start");
				},
			} as never,
		);

		try {
			await expect(executor.execute(fakeRunState("plan"))).rejects.toThrow(
				"Project pre-hook failed",
			);
			await expect(readFile(markerPath, "utf8")).resolves.toBe("pre\nafter\n");
		} finally {
			await rm(tempDir, { force: true, recursive: true });
		}
	});
});

function fakeAgentAdapter(
	run: (method: string) => Promise<AgentResult>,
): AgentAdapter {
	return {
		runAgent: (request: AgentAdapterRunRequest) =>
			run(`runAgent:${request.role}`),
		runPlan: () => run("runPlan"),
		runTaskIntake: () => run("runTaskIntake"),
		resume: () => run("resume"),
		runReview: () => run("runReview"),
		runGithubComment: () => run("runGithubComment"),
	};
}

function fakeNotifications() {
	return {
		email: {
			enabled: false,
			to: [],
		},
	};
}

function fakeLinearClient() {
	return {
		fetchWork: async () => [],
		fetchIssueByIdentifier: async () => null,
		fetchReviewOnlyWork: async () => [],
		isAssignedState: async () => true,
		markStage: async () => undefined,
		markCanceled: async () => undefined,
		createBacklogTask: async () => ({
			id: "1",
			identifier: "T-1",
			title: "t",
			url: "u",
		}),
		createTodoIssueFromPlan: async () => ({
			id: "1",
			identifier: "T-1",
			title: "t",
			url: "u",
		}),
		applyStageLabel: async () => undefined,
		clearWorkflowStageLabels: async () => undefined,
		comment: async () => undefined,
	};
}

function fakeProject(): ResolvedProjectConfig {
	return {
		id: "default",
		name: "Default",
		workspacePath: "/tmp/workspace",
		executionPath: "/tmp/workspace",
		repo: { owner: "o", name: "r", baseBranch: "main" },
		github: { useGhCli: true, defaultBugLabel: "bug" },
		server: { database: { databasePath: "/tmp/devos.sqlite", port: 0 } },
		codex: { binary: "codex", streamLogs: false },
		workflow: { issueConcurrency: 1 },
		skills: {
			root: "skills",
			brainstorm: "brainstorm",
			plan: "plan",
			implement: "implement",
			reviewTest: "review",
			githubComment: "comment",
		},
		dryRun: true,
	};
}

function fakeRunState(stage: RunState["stage"]): RunState {
	return {
		projectId: "default",
		projectName: "Default",
		workspacePath: "/tmp/workspace",
		repository: { owner: "o", name: "r", baseBranch: "main" },
		issue: {
			id: "issue-1",
			key: "ENG-7",
			title: "Build workflow",
			url: "devos://tasks/issue-1",
		},
		stage,
		bugs: [],
		startedAt: "2026-05-27T00:00:00.000Z",
		updatedAt: "2026-05-27T00:00:00.000Z",
	};
}

function successfulCommand(): CommandResult {
	return {
		code: 0,
		stdout: "",
		stderr: "",
	};
}
