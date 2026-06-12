export type ImplementationSubAgentStatus =
	| "pending"
	| "running"
	| "completed"
	| "merged"
	| "failed";

export interface ImplementationSubAgentTask {
	id: string;
	title: string;
	description?: string;
	ownedPaths?: string[];
	verification?: string;
}

export interface ImplementationSubAgentRun extends ImplementationSubAgentTask {
	status: ImplementationSubAgentStatus;
	branch?: string;
	worktreePath?: string;
	sessionId?: string;
	summary?: string;
	error?: string;
	startedAt?: string;
	completedAt?: string;
	mergedAt?: string;
}
