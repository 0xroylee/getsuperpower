import { createAgentAdapter } from "adapters";
import {
	commentOnPr,
	createDraftPrFromWorktree,
	ensureBaseBranchFresh,
	ensureIssueWorktree,
	findOpenPullRequestForIssue,
	getPullRequestMergeStatus,
	markPrReadyForReview,
	prepareImplementationBranch,
	prepareWorktreeDependencies,
	removeIssueWorktree,
	squashMergePullRequest,
	updateDraftPrFromWorktree,
} from "../../../integrations/github";
import {
	createDraftPrFromPublishedBranch,
	pushImplementationBranch,
} from "../../../integrations/github/published-branch-pr";
import {
	commitImplementationSubAgentWorktree,
	ensureImplementationSubAgentWorktree,
	mergeImplementationSubAgentBranch,
} from "../../../integrations/github/worktree-merge";
import {
	sendHumanReviewRequiredEmail,
	sendTaskOutcomeEmail,
} from "../../../integrations/notifications";
import { createBoardTaskWorkflowClient } from "../board-task-workflow-client";
import type { WorkflowRuntime } from "../types/workflow.types";

export function createWorkflowRuntime(
	overrides: Partial<WorkflowRuntime> = {},
): WorkflowRuntime {
	return {
		createTaskClient: createBoardTaskWorkflowClient,
		createAgentAdapter: createAgentAdapter,
		ensureBaseBranchFresh,
		ensureIssueWorktree,
		prepareWorktreeDependencies,
		findOpenPullRequestForIssue,
		getPullRequestMergeStatus,
		prepareImplementationBranch,
		ensureImplementationSubAgentWorktree,
		commitImplementationSubAgentWorktree,
		mergeImplementationSubAgentBranch,
		removeIssueWorktree,
		createDraftPrFromWorktree,
		createDraftPrFromPublishedBranch,
		updateDraftPrFromWorktree,
		pushImplementationBranch,
		commentOnPr,
		markPrReadyForReview,
		squashMergePullRequest,
		sendTaskOutcomeEmail: sendTaskOutcomeEmail,
		sendHumanReviewRequiredEmail: sendHumanReviewRequiredEmail,
		...overrides,
	};
}
