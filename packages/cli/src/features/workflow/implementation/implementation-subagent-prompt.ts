import type { IssueRef, RunState } from "../../types";
import type { ImplementationSubAgentTask } from "../types/implementation-subagent.types";

export function buildImplementationSubAgentPrompt(input: {
	issue: IssueRef;
	planSummary: string;
	task: ImplementationSubAgentTask;
	parentBranch: string;
}): string {
	const { issue, parentBranch, planSummary, task } = input;
	const ownedPaths =
		task.ownedPaths && task.ownedPaths.length > 0
			? task.ownedPaths.map((item) => `- ${item}`).join("\n")
			: "- Use the task description and plan to keep edits scoped.";
	return [
		"You are an implementation sub-agent in the devos.ing workflow.",
		"Work only on the assigned sub-agent task in the current child worktree.",
		"The parent workflow will commit, merge, and create or update the pull request after you finish.",
		"Do not create a pull request and do not merge branches yourself.",
		"",
		`Parent workflow task: ${issue.key}`,
		`Title: ${issue.title}`,
		`Parent branch: ${parentBranch}`,
		"",
		`Sub-agent task id: ${task.id}`,
		`Sub-agent task title: ${task.title}`,
		...(task.description ? ["", "Task description:", task.description] : []),
		"",
		"Owned paths:",
		ownedPaths,
		...(task.verification
			? ["", "Required verification signal:", task.verification]
			: []),
		"",
		"Full parent plan:",
		planSummary,
		"",
		"Report completed files, checks run, and remaining risk. If blocked, say exactly what blocked the task.",
	].join("\n");
}

export function summarizeImplementationSubAgents(
	runs: RunState["implementationSubAgents"],
): string {
	const items = runs ?? [];
	return items
		.map((run) =>
			[
				`Sub-agent ${run.id}: ${run.title}`,
				`Status: ${run.status}`,
				run.summary ? `Summary: ${run.summary}` : undefined,
				run.error ? `Error: ${run.error}` : undefined,
			]
				.filter(Boolean)
				.join("\n"),
		)
		.join("\n\n");
}
