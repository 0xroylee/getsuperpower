import path from "node:path";
import { type AgentAdapter, type AgentResult, runAdapterAgent } from "adapters";
import type { ResolvedProjectConfig, RunState } from "../../types";
import { runAgentWithChatLog } from "../agents/agent-chat-log";
import { resolveAgentLogMetadata } from "../agents/agent-log-metadata";
import { emitActionProgress } from "../progress";
import { normalizeIssueKey, saveRunState } from "../state";
import type {
	ImplementationSubAgentRun,
	ImplementationSubAgentTask,
} from "../types/implementation-subagent.types";
import type { WorkflowRuntime } from "../types/workflow.types";
import {
	buildImplementationSubAgentPrompt,
	summarizeImplementationSubAgents,
} from "./implementation-subagent-prompt";

interface RunImplementationSubAgentsInput {
	config: ResolvedProjectConfig;
	runtime: WorkflowRuntime;
	state: RunState;
	tasks: ImplementationSubAgentTask[];
}

export async function runImplementationSubAgents({
	config,
	runtime,
	state,
	tasks,
}: RunImplementationSubAgentsInput): Promise<AgentResult> {
	const parentBranch = state.pullRequest?.branch;
	if (!parentBranch) {
		throw new Error("Missing parent implementation branch for sub-agents");
	}
	state.implementationSubAgents = tasks.map((task) => ({
		...task,
		status: "pending",
	}));
	await saveRunState(config.workspacePath, state);
	const attemptId = subAgentAttemptId(state.updatedAt);
	const results: AgentResult[] = [];
	for (const task of tasks) {
		const run = subAgentRunForTask(
			config,
			state,
			parentBranch,
			task,
			attemptId,
		);
		results.push(
			await runSingleImplementationSubAgent(config, runtime, state, run),
		);
	}
	const summary = summarizeImplementationSubAgents(
		state.implementationSubAgents,
	);
	return { finalMessage: summary, stdout: "", usage: aggregateUsage(results) };
}

async function runSingleImplementationSubAgent(
	config: ResolvedProjectConfig,
	runtime: WorkflowRuntime,
	state: RunState,
	run: ImplementationSubAgentRun,
): Promise<AgentResult> {
	const branch = requireRunValue(run.branch, "branch");
	const worktreePath = requireRunValue(run.worktreePath, "worktreePath");
	const parentBranch = requireRunValue(
		state.pullRequest?.branch,
		"parent branch",
	);
	try {
		await recordRun(state, config.workspacePath, {
			...run,
			status: "running",
			startedAt: new Date().toISOString(),
		});
		emitActionProgress(
			state,
			"in_progress",
			"implementation-subagent",
			"started",
			{
				detail: run.title,
			},
		);
		await runtime.ensureImplementationSubAgentWorktree(config, {
			parentBranch,
			branch,
			worktreePath,
		});
		await runtime.prepareWorktreeDependencies(worktreePath);
		const childConfig = { ...config, executionPath: worktreePath };
		const childAgent = runtime.createAgentAdapter(childConfig);
		const result = await runChildAgent(childAgent, childConfig, state, run);
		await runtime.commitImplementationSubAgentWorktree(childConfig, {
			taskId: run.id,
			message: `devos sub-agent ${state.issue.key} ${run.id}`,
		});
		await runtime.mergeImplementationSubAgentBranch(config, branch);
		await runtime.removeIssueWorktree(config, worktreePath);
		await recordRun(state, config.workspacePath, {
			...run,
			status: "merged",
			sessionId: result.sessionId,
			summary: result.finalMessage || result.stdout,
			completedAt: new Date().toISOString(),
			mergedAt: new Date().toISOString(),
		});
		emitActionProgress(
			state,
			"in_progress",
			"implementation-subagent",
			"succeeded",
			{
				detail: run.title,
			},
		);
		return result;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		await recordRun(state, config.workspacePath, {
			...run,
			status: "failed",
			error: message,
			completedAt: new Date().toISOString(),
		});
		emitActionProgress(
			state,
			"in_progress",
			"implementation-subagent",
			"failed",
			{
				detail: run.title,
				error: message,
			},
		);
		throw error;
	}
}

async function runChildAgent(
	agent: AgentAdapter,
	config: ResolvedProjectConfig,
	state: RunState,
	run: ImplementationSubAgentRun,
): Promise<AgentResult> {
	const prompt = buildImplementationSubAgentPrompt({
		issue: state.issue,
		planSummary: state.planSummary ?? "",
		task: run,
		parentBranch: requireRunValue(state.pullRequest?.branch, "parent branch"),
	});
	return runAgentWithChatLog({
		workspacePath: config.workspacePath,
		projectId: config.id,
		issue: state.issue,
		agentRole: "implementing",
		...resolveAgentLogMetadata(config, "implementing"),
		phrase: `implementation sub-agent ${run.id}`,
		skillPath: config.skills.implement,
		prompt,
		invoke: ({ onStream } = { onStream: () => {} }) =>
			runAdapterAgent(agent, {
				role: "implementing",
				prompt,
				skills: [{ name: "implementation", path: config.skills.implement }],
				onStream,
			}),
	});
}

function subAgentRunForTask(
	config: ResolvedProjectConfig,
	state: RunState,
	parentBranch: string,
	task: ImplementationSubAgentTask,
	attemptId: string,
): ImplementationSubAgentRun {
	const issueKey = normalizeIssueKey(state.issue.key).toLowerCase();
	return {
		...task,
		status: "pending",
		branch: `${parentBranch}-subagent-${task.id}-${attemptId}`,
		worktreePath: path.join(
			config.workspacePath,
			".devos",
			"projects",
			config.id,
			"subagents",
			issueKey,
			`${task.id}-${attemptId}`,
		),
	};
}

function subAgentAttemptId(updatedAt: string): string {
	const normalized = updatedAt.replace(/[^0-9a-z]/gi, "").toLowerCase();
	return normalized.slice(0, 15) || Date.now().toString(36);
}

async function recordRun(
	state: RunState,
	workspacePath: string,
	run: ImplementationSubAgentRun,
): Promise<void> {
	const current = state.implementationSubAgents ?? [];
	state.implementationSubAgents = current.map((candidate) =>
		candidate.id === run.id ? run : candidate,
	);
	await saveRunState(workspacePath, state);
}

function aggregateUsage(results: AgentResult[]): AgentResult["usage"] {
	const usages = results.map((result) => result.usage).filter(Boolean);
	if (!usages.length) {
		return undefined;
	}
	return usages.reduce<NonNullable<AgentResult["usage"]>>(
		(total, usage) => ({
			inputTokens: addNumbers(total.inputTokens, usage?.inputTokens),
			outputTokens: addNumbers(total.outputTokens, usage?.outputTokens),
			totalTokens: addNumbers(total.totalTokens, usage?.totalTokens),
		}),
		{},
	);
}

function addNumbers(left?: number, right?: number): number | undefined {
	if (left === undefined && right === undefined) {
		return undefined;
	}
	return (left ?? 0) + (right ?? 0);
}

function requireRunValue(value: string | undefined, label: string): string {
	if (!value) {
		throw new Error(`Missing implementation sub-agent ${label}`);
	}
	return value;
}
