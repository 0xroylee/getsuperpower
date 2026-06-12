import { access } from "node:fs/promises";
import type { ResolvedProjectConfig } from "../../features/types";
import {
	PREP_COMMAND_TIMEOUT_MS,
	runPrepCommandWithRetry,
} from "../../utils/prep-command-retry";
import { assertCommandOk, runCommand } from "../../utils/shell";
import type {
	CommitSubAgentWorktreeInput,
	EnsureSubAgentWorktreeInput,
	GithubCommandDeps,
} from "./types/github.types";

export async function ensureImplementationSubAgentWorktree(
	config: ResolvedProjectConfig,
	input: EnsureSubAgentWorktreeInput,
	deps: GithubCommandDeps = {},
): Promise<void> {
	const commandRunner = deps.runCommand ?? runCommand;
	const assertOk = deps.assertCommandOk ?? assertCommandOk;
	await assertInsideGitWorktree(config, deps);
	try {
		await access(input.worktreePath);
		const current = await commandRunner("git", ["branch", "--show-current"], {
			cwd: input.worktreePath,
			timeoutMs: PREP_COMMAND_TIMEOUT_MS,
		});
		assertOk("git", ["branch", "--show-current"], current);
		if (current.stdout.trim() !== input.branch) {
			throw new Error(
				`Sub-agent worktree '${input.worktreePath}' is on branch '${current.stdout.trim()}', expected '${input.branch}'`,
			);
		}
		return;
	} catch (error) {
		if (error instanceof Error && error.message.includes("expected")) {
			throw error;
		}
	}
	const existing = await commandRunner(
		"git",
		["show-ref", "--verify", "--quiet", `refs/heads/${input.branch}`],
		{ cwd: config.executionPath, timeoutMs: PREP_COMMAND_TIMEOUT_MS },
	);
	if (existing.code === 0) {
		const addExisting = await runPrepCommandWithRetry(
			"git add implementation sub-agent worktree",
			"git",
			["worktree", "add", input.worktreePath, input.branch],
			{ cwd: config.executionPath },
			commandRunner,
		);
		assertOk(
			"git",
			["worktree", "add", input.worktreePath, input.branch],
			addExisting,
		);
		return;
	}
	const add = await runPrepCommandWithRetry(
		"git create implementation sub-agent worktree",
		"git",
		[
			"worktree",
			"add",
			"-b",
			input.branch,
			input.worktreePath,
			input.parentBranch,
		],
		{ cwd: config.executionPath },
		commandRunner,
	);
	assertOk(
		"git",
		[
			"worktree",
			"add",
			"-b",
			input.branch,
			input.worktreePath,
			input.parentBranch,
		],
		add,
	);
}

export async function commitImplementationSubAgentWorktree(
	config: ResolvedProjectConfig,
	input: CommitSubAgentWorktreeInput,
	deps: GithubCommandDeps = {},
): Promise<boolean> {
	const commandRunner = deps.runCommand ?? runCommand;
	const assertOk = deps.assertCommandOk ?? assertCommandOk;
	const add = await commandRunner("git", ["add", "-A"], {
		cwd: config.executionPath,
	});
	assertOk("git", ["add", "-A"], add);
	const diff = await commandRunner("git", ["diff", "--cached", "--quiet"], {
		cwd: config.executionPath,
	});
	if (diff.code === 0) {
		return false;
	}
	const commit = await commandRunner("git", ["commit", "-m", input.message], {
		cwd: config.executionPath,
	});
	assertOk("git", ["commit", "-m", input.message], commit);
	return true;
}

export async function mergeImplementationSubAgentBranch(
	config: ResolvedProjectConfig,
	branch: string,
	deps: GithubCommandDeps = {},
): Promise<void> {
	const commandRunner = deps.runCommand ?? runCommand;
	const assertOk = deps.assertCommandOk ?? assertCommandOk;
	const merge = await commandRunner(
		"git",
		["merge", "--no-ff", "--no-edit", branch],
		{
			cwd: config.executionPath,
			timeoutMs: PREP_COMMAND_TIMEOUT_MS,
		},
	);
	assertOk("git", ["merge", "--no-ff", "--no-edit", branch], merge);
}

async function assertInsideGitWorktree(
	config: ResolvedProjectConfig,
	deps: GithubCommandDeps,
): Promise<void> {
	const commandRunner = deps.runCommand ?? runCommand;
	const assertOk = deps.assertCommandOk ?? assertCommandOk;
	const result = await commandRunner(
		"git",
		["rev-parse", "--is-inside-work-tree"],
		{ cwd: config.executionPath },
	);
	assertOk("git", ["rev-parse", "--is-inside-work-tree"], result);
}
