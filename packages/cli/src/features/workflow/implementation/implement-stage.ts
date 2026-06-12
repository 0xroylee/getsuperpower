import type { AgentAdapter } from "adapters";
import { issueBranchName } from "../../../integrations/github";
import { buildImplementationComment } from "../../../utils/comments";
import { logger } from "../../../utils/logger";
import type {
	ResolvedProjectConfig,
	RunState,
	WorkflowStage,
} from "../../types";
import { buildIssueJobLogFields } from "../mission/issue-job-log-fields";
import { saveRunState, transitionStage } from "../state";
import type {
	WorkflowRuntime,
	WorkflowTaskClient,
} from "../types/workflow.types";
import { appendCodexUsage } from "../usage/usage-state";
import { runImplementationSubAgents } from "./implementation-subagent-orchestrator";
import { parseImplementationSubAgentTasks } from "./implementation-subagent-plan";
import { runSingleImplementationAgent } from "./single-implementation-agent";

const NO_STAGED_CHANGES_ERROR =
	"No staged changes found after implement step; cannot create PR";

export function fixedBugsForImplementationComment(
	hasExistingPr: boolean,
	bugs: RunState["bugs"],
): RunState["bugs"] {
	if (!hasExistingPr || bugs.length === 0) {
		return [];
	}
	return bugs.map((bug) => ({
		title: bug.title,
		body: bug.body,
		issueUrl: bug.issueUrl,
	}));
}

export async function handleImplementingStage(
	config: ResolvedProjectConfig,
	agent: AgentAdapter,
	taskClient: WorkflowTaskClient,
	state: RunState,
	runtime: WorkflowRuntime,
): Promise<void> {
	if (!state.codexSessionId) {
		throw new Error("Missing codex session id for implement step");
	}
	const codexSessionId = state.codexSessionId;
	logger.info(
		buildIssueJobLogFields(state, "in_progress"),
		"Implementing issue",
	);

	await prepareImplementationBranchForStage(config, state, runtime);

	const hasExistingPr = Boolean(state.pullRequest?.url);
	const fixRound = hasExistingPr && state.bugs.length > 0;
	const fixedBugs = fixedBugsForImplementationComment(
		hasExistingPr,
		state.bugs,
	);
	const subAgentTasks = fixRound
		? []
		: parseImplementationSubAgentTasks(state.planSummary);
	const useSubAgents = subAgentTasks.length > 0 && !config.dryRun;
	const result = useSubAgents
		? await runImplementationSubAgents({
				config,
				runtime,
				state,
				tasks: subAgentTasks,
			})
		: await runSingleImplementationAgent({
				agent,
				codexSessionId,
				config,
				fixRound,
				state,
			});
	state.implementationSummary = result.finalMessage || result.stdout;
	appendCodexUsage(state, "implementing", result.usage, {
		agentBackend: result.backend,
	});

	if (!hasExistingPr) {
		if (config.dryRun) {
			state.pullRequest = {
				branch: issueBranchName(state.issue.key, state.issue.branchName),
				title: `[codex] ${state.issue.key}: ${state.issue.title}`,
				url: "https://example.invalid/dry-run",
			};
		} else if (useSubAgents) {
			const branch = requirePullRequestBranch(state);
			state.pullRequest = await runtime.createDraftPrFromPublishedBranch(
				config,
				state.issue.key,
				state.issue.title,
				branch,
			);
		} else {
			state.pullRequest = await runtime
				.createDraftPrFromWorktree(
					config,
					state.issue.key,
					state.issue.title,
					state.issue.branchName,
				)
				.catch((error) => {
					if (!isNoStagedChangesError(error)) {
						throw error;
					}
					throw noImplementationChangesError(
						state.implementationSummary,
						error,
					);
				});
		}
	} else if (!config.dryRun) {
		if (!state.pullRequest?.branch) {
			throw new Error("Missing pull request branch for feedback pass");
		}
		if (useSubAgents) {
			await runtime.pushImplementationBranch(config, state.pullRequest.branch);
		} else {
			const updated = await runtime.updateDraftPrFromWorktree(
				config,
				state.pullRequest.branch,
				state.issue.key,
			);
			if (!updated) {
				logger.info(
					buildIssueJobLogFields(state, "in_progress"),
					"No code changes after feedback; skipping PR update",
				);
			}
		}
	}
	if (state.pullRequest) {
		await taskClient.linkPullRequest?.(state.issue.id, state.pullRequest);
	}

	state.bugs = [];
	const nextStage: WorkflowStage = "in_review";
	Object.assign(state, transitionStage(state, nextStage));
	await saveRunState(config.workspacePath, state);
	await taskClient.markStage(state.issue.id, nextStage);
	await taskClient.applyStageLabel(state.issue.id, nextStage);
	await taskClient.comment(
		state.issue.id,
		buildImplementationComment(state.pullRequest?.url, result.usage, {
			updated: hasExistingPr,
			fixedBugs,
		}),
	);
	logger.info(
		buildIssueJobLogFields(state, "in_progress"),
		hasExistingPr
			? "Implementation feedback pass completed"
			: "Implementation completed",
	);
}

function isNoStagedChangesError(error: unknown): boolean {
	return (
		error instanceof Error && error.message.includes(NO_STAGED_CHANGES_ERROR)
	);
}

function noImplementationChangesError(
	implementationSummary: string | undefined,
	cause: unknown,
): Error {
	const summary = implementationSummary?.trim() || "No agent output recorded.";
	const error = new Error(
		[
			"Implementation completed without file changes; no draft PR was created.",
			`Agent output: ${summary}`,
		].join("\n\n"),
	);
	Object.assign(error, { cause });
	return error;
}

function requirePullRequestBranch(state: RunState): string {
	if (!state.pullRequest?.branch) {
		throw new Error("Missing pull request branch after sub-agent merge");
	}
	return state.pullRequest.branch;
}

export async function prepareImplementationBranchForStage(
	config: ResolvedProjectConfig,
	state: RunState,
	runtime: WorkflowRuntime,
): Promise<void> {
	if (config.dryRun) {
		return;
	}
	if (state.executionWorkspace?.mode === "git-worktree") {
		const preparedBranch =
			state.pullRequest?.branch ?? state.executionWorkspace.branch;
		if (state.executionWorkspace.branch !== preparedBranch) {
			throw new Error(
				`Isolated worktree branch '${state.executionWorkspace.branch}' does not match expected branch '${preparedBranch}'`,
			);
		}
		if (!state.pullRequest) {
			state.pullRequest = {
				branch: preparedBranch,
				title: `[codex] ${state.issue.key}: ${state.issue.title}`,
			};
		}
		return;
	}
	const preparedBranch = await runtime.prepareImplementationBranch(
		config,
		state.issue.key,
		state.pullRequest,
		state.issue.branchName,
	);
	if (!state.pullRequest) {
		state.pullRequest = {
			branch: preparedBranch,
			title: `[codex] ${state.issue.key}: ${state.issue.title}`,
		};
	}
}
