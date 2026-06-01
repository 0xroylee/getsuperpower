import type { CommandResult } from "../../utils/shell";
import { assertCommandOk, runCommand } from "../../utils/shell";
import type { ReleaseCommand, ReleaseCommandDeps } from "./types/release.types";

export async function handleReleaseCommand(
	command: ReleaseCommand,
	cwd: string,
	deps: ReleaseCommandDeps = {},
): Promise<void> {
	if (command.action === "list") {
		await listGitHubReleases(command, cwd, deps);
		return;
	}
	await tagRelease(command, cwd, deps);
}

async function listGitHubReleases(
	command: Extract<ReleaseCommand, { action: "list" }>,
	cwd: string,
	deps: ReleaseCommandDeps,
): Promise<void> {
	const args = ["release", "list"];
	if (command.limit !== undefined) {
		args.push("--limit", String(command.limit));
	}
	if (command.repo !== undefined) {
		args.push("--repo", command.repo);
	}
	await runChecked("gh", args, cwd, deps);
}

async function tagRelease(
	command: Extract<ReleaseCommand, { action: "tag" }>,
	cwd: string,
	deps: ReleaseCommandDeps,
): Promise<void> {
	const message = command.message ?? `Release ${command.tag}`;
	await runChecked("git", ["tag", "-a", command.tag, "-m", message], cwd, deps);
	await runChecked("git", ["push", command.remote, command.tag], cwd, deps);
}

async function runChecked(
	command: string,
	args: string[],
	cwd: string,
	deps: ReleaseCommandDeps,
): Promise<void> {
	const runner = deps.runCommand ?? runCommand;
	const assertOk = deps.assertCommandOk ?? assertCommandOk;
	const result: CommandResult = await runner(command, args, {
		cwd,
		streamStdout: true,
		streamStderr: true,
	});
	assertOk(command, args, result);
}
