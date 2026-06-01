import { describe, expect, it, mock } from "bun:test";
import { handleReleaseCommand } from "../src/features/release/release-command";
import type { CommandResult } from "../src/utils/shell";

describe("handleReleaseCommand", () => {
	it("lists GitHub releases through gh", async () => {
		const calls: Array<{ command: string; args: string[]; cwd: string }> = [];
		const runCommand = mock(
			async (
				command: string,
				args: string[],
				options: { cwd: string },
			): Promise<CommandResult> => {
				calls.push({ command, args, cwd: options.cwd });
				return { code: 0, stdout: "", stderr: "" };
			},
		);

		await handleReleaseCommand(
			{ action: "list", limit: 5, repo: "acme/devos" },
			"/tmp/repo",
			{ runCommand, assertCommandOk: assertOk },
		);

		expect(calls).toEqual([
			{
				command: "gh",
				args: ["release", "list", "--limit", "5", "--repo", "acme/devos"],
				cwd: "/tmp/repo",
			},
		]);
	});

	it("creates and pushes an annotated tag without creating a GitHub release", async () => {
		const calls: Array<{ command: string; args: string[] }> = [];
		const runCommand = mock(
			async (command: string, args: string[]): Promise<CommandResult> => {
				calls.push({ command, args });
				return { code: 0, stdout: "", stderr: "" };
			},
		);

		await handleReleaseCommand(
			{
				action: "tag",
				tag: "v0.0.1",
				message: "Release v0.0.1",
				remote: "origin",
			},
			"/tmp/repo",
			{ runCommand, assertCommandOk: assertOk },
		);

		expect(calls).toEqual([
			{
				command: "git",
				args: ["tag", "-a", "v0.0.1", "-m", "Release v0.0.1"],
			},
			{ command: "git", args: ["push", "origin", "v0.0.1"] },
		]);
	});
});

function assertOk(
	command: string,
	args: string[],
	result: CommandResult,
): void {
	if (result.code !== 0) {
		throw new Error(`${command} ${args.join(" ")} failed`);
	}
}
