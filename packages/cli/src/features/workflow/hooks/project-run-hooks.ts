import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { logger } from "../../../utils/logger";
import { PREP_COMMAND_TIMEOUT_MS } from "../../../utils/prep-command-retry";
import { runCommand } from "../../../utils/shell";
import type {
	CommandResult,
	RunCommandOptions,
} from "../../../utils/types/shell.types";
import type { ResolvedProjectConfig } from "../../types";

export type ProjectRunHookName = "after" | "pre";

export type ProjectRunHookResult =
	| { status: "skipped" }
	| { status: "succeeded" }
	| { status: "failed"; error: string };

export type ProjectRunHookCommandRunner = (
	command: string,
	args: string[],
	options: RunCommandOptions,
) => Promise<CommandResult>;

export type ProjectRunHookFailureLogger = (
	fields: { error: string; hookName: ProjectRunHookName; projectId: string },
	message: string,
) => void;

export async function runProjectHookScript(input: {
	config: ResolvedProjectConfig;
	hookName: ProjectRunHookName;
	script: string | null | undefined;
	commandRunner?: ProjectRunHookCommandRunner;
}): Promise<ProjectRunHookResult> {
	if (!input.script?.trim()) {
		return { status: "skipped" };
	}
	const commandRunner = input.commandRunner ?? runCommand;
	const tempDir = await mkdtemp(path.join(os.tmpdir(), "devos-project-hook-"));
	const scriptPath = path.join(tempDir, `${input.hookName}-hook.sh`);

	try {
		await writeFile(scriptPath, input.script, "utf8");
		const result = await commandRunner("sh", [scriptPath], {
			cwd: input.config.executionPath,
			timeoutMs: PREP_COMMAND_TIMEOUT_MS,
		});
		if (result.code !== 0) {
			throw new Error(formatHookFailure(input.hookName, result));
		}
		return { status: "succeeded" };
	} finally {
		await rm(tempDir, { force: true, recursive: true });
	}
}

export async function runProjectHookScriptSafely(input: {
	config: ResolvedProjectConfig;
	hookName: ProjectRunHookName;
	script: string | null | undefined;
	commandRunner?: ProjectRunHookCommandRunner;
	loggerWarn?: ProjectRunHookFailureLogger;
}): Promise<ProjectRunHookResult> {
	try {
		return await runProjectHookScript(input);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const loggerWarn = input.loggerWarn ?? logger.warn.bind(logger);
		loggerWarn(
			{ projectId: input.config.id, hookName: input.hookName, error: message },
			"Project workflow hook failed",
		);
		return { status: "failed", error: message };
	}
}

function formatHookFailure(
	hookName: ProjectRunHookName,
	result: CommandResult,
): string {
	const output = (
		result.stderr ||
		result.stdout ||
		`exit code ${result.code}`
	).trim();
	return `Project ${hookName}-hook failed: ${output}`;
}
