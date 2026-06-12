import {
	DEFAULT_GITHUB_PR_INSTRUCTION,
	renderGithubInstruction,
} from "../../features/config/github-instructions";
import type {
	PullRequestRef,
	ResolvedProjectConfig,
} from "../../features/types";
import { assertCommandOk, runCommand } from "../../utils/shell";
import type { GithubCommandDeps } from "./types/github.types";

export async function pushImplementationBranch(
	config: ResolvedProjectConfig,
	branch: string,
	deps: GithubCommandDeps = {},
): Promise<void> {
	const commandRunner = deps.runCommand ?? runCommand;
	const assertOk = deps.assertCommandOk ?? assertCommandOk;
	await ensurePublishableBranch(config, branch, deps);
	const push = await commandRunner("git", ["push", "-u", "origin", branch], {
		cwd: config.executionPath,
	});
	assertOk("git", ["push", "-u", "origin", branch], push);
}

export async function createDraftPrFromPublishedBranch(
	config: ResolvedProjectConfig,
	issueKey: string,
	issueTitle: string,
	branch: string,
	deps: GithubCommandDeps = {},
): Promise<PullRequestRef> {
	const commandRunner = deps.runCommand ?? runCommand;
	const assertOk = deps.assertCommandOk ?? assertCommandOk;
	await pushImplementationBranch(config, branch, deps);
	const auth = await commandRunner("gh", ["auth", "status"], {
		cwd: config.executionPath,
	});
	assertOk("gh", ["auth", "status"], auth);

	const prTitle = `[codex] ${issueKey}: ${issueTitle}`;
	const prBody = renderGithubInstruction(
		config.github.prInstruction,
		{
			baseBranch: config.repo.baseBranch,
			branch,
			issueKey,
			issueTitle,
		},
		DEFAULT_GITHUB_PR_INSTRUCTION,
	);
	const create = await commandRunner(
		"gh",
		[
			"pr",
			"create",
			"--draft",
			"--title",
			prTitle,
			"--body",
			prBody,
			"--base",
			config.repo.baseBranch,
			"--head",
			branch,
		],
		{ cwd: config.executionPath },
	);
	assertOk("gh", ["pr", "create"], create);

	const prUrl = create.stdout.trim().split("\n").filter(Boolean).at(-1);
	return {
		number: parsePrNumber(prUrl),
		url: prUrl,
		branch,
		title: prTitle,
	};
}

async function ensurePublishableBranch(
	config: ResolvedProjectConfig,
	branch: string,
	deps: GithubCommandDeps,
): Promise<void> {
	const commandRunner = deps.runCommand ?? runCommand;
	const assertOk = deps.assertCommandOk ?? assertCommandOk;
	const repo = await commandRunner(
		"git",
		["rev-parse", "--is-inside-work-tree"],
		{ cwd: config.executionPath },
	);
	assertOk("git", ["rev-parse", "--is-inside-work-tree"], repo);

	const current = await commandRunner("git", ["branch", "--show-current"], {
		cwd: config.executionPath,
	});
	assertOk("git", ["branch", "--show-current"], current);
	if (current.stdout.trim() !== branch) {
		throw new Error(
			`Current branch '${current.stdout.trim()}' does not match expected implementation branch '${branch}'`,
		);
	}

	const status = await commandRunner("git", ["status", "--porcelain"], {
		cwd: config.executionPath,
	});
	assertOk("git", ["status", "--porcelain"], status);
	if (status.stdout.trim()) {
		throw new Error(
			"Working tree is not clean after sub-agent merge; cannot publish implementation branch",
		);
	}
}

function parsePrNumber(prUrl: string | undefined): number | undefined {
	const match = prUrl?.match(/\/pull\/(\d+)/);
	return match ? Number(match[1]) : undefined;
}
