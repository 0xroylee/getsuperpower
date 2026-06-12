import { describe, expect, it, mock } from "bun:test";
import type { ResolvedProjectConfig } from "../src/features/types";
import { createDraftPrFromPublishedBranch } from "../src/integrations/github/published-branch-pr";
import type { CommandResult } from "../src/utils/shell";

describe("createDraftPrFromPublishedBranch", () => {
	it("pushes an already committed branch and opens a draft PR", async () => {
		const calls: Array<{ command: string; args: string[] }> = [];
		const runCommand = mock(
			async (command: string, args: string[]): Promise<CommandResult> => {
				calls.push({ command, args });
				if (args[0] === "rev-parse") {
					return { code: 0, stdout: "true\n", stderr: "" };
				}
				if (args[0] === "branch") {
					return { code: 0, stdout: "codex/wor-56\n", stderr: "" };
				}
				if (args[0] === "status") {
					return { code: 0, stdout: "", stderr: "" };
				}
				if (args[0] === "pr") {
					return {
						code: 0,
						stdout: "https://github.com/acme/repo/pull/56\n",
						stderr: "",
					};
				}
				return { code: 0, stdout: "", stderr: "" };
			},
		);

		const pr = await createDraftPrFromPublishedBranch(
			createProjectConfig(),
			"WOR-56",
			"Sub-agent merge",
			"codex/wor-56",
			{ runCommand, assertCommandOk: assertOk },
		);

		expect(pr).toEqual({
			branch: "codex/wor-56",
			number: 56,
			title: "[codex] WOR-56: Sub-agent merge",
			url: "https://github.com/acme/repo/pull/56",
		});
		expect(calls.map((call) => call.args[0])).toEqual([
			"rev-parse",
			"branch",
			"status",
			"push",
			"auth",
			"pr",
		]);
		expect(
			calls.some((call) => ["add", "diff", "commit"].includes(call.args[0])),
		).toBe(false);
	});

	it("rejects dirty parent branches before publishing", async () => {
		const calls: Array<string[]> = [];
		const runCommand = mock(
			async (_command: string, args: string[]): Promise<CommandResult> => {
				calls.push(args);
				if (args[0] === "branch") {
					return { code: 0, stdout: "codex/wor-56\n", stderr: "" };
				}
				if (args[0] === "status") {
					return {
						code: 0,
						stdout: " M packages/cli/src/index.ts\n",
						stderr: "",
					};
				}
				return { code: 0, stdout: "", stderr: "" };
			},
		);

		await expect(
			createDraftPrFromPublishedBranch(
				createProjectConfig(),
				"WOR-56",
				"Sub-agent merge",
				"codex/wor-56",
				{ runCommand, assertCommandOk: assertOk },
			),
		).rejects.toThrow("Working tree is not clean after sub-agent merge");
		expect(calls.some((args) => args[0] === "push")).toBe(false);
	});
});

function assertOk(
	_command: string,
	_args: string[],
	result: CommandResult,
): void {
	if (result.code !== 0) {
		throw new Error(result.stderr || result.stdout || "command failed");
	}
}

function createProjectConfig(): ResolvedProjectConfig {
	return {
		id: "default",
		name: "Default",
		workspacePath: "/tmp/workspace",
		executionPath: "/tmp/repo",
		repo: { owner: "acme", name: "repo", baseBranch: "main" },
		github: { useGhCli: true, defaultBugLabel: "bug" },
		server: {
			database: {
				databasePath: "/tmp/workspace/.devos/config/server-db",
				port: 54329,
			},
		},
		codex: { binary: "codex", streamLogs: false },
		skills: {
			root: "/tmp/skills",
			brainstorm: "/tmp/brainstorm.md",
			plan: "/tmp/plan.md",
			implement: "/tmp/implement.md",
			reviewTest: "/tmp/review.md",
			githubComment: "/tmp/github-comment.md",
		},
		workflow: { issueConcurrency: 1 },
		dryRun: false,
	};
}
