import type { Command } from "commander";
import { parsePositiveInt } from "../args-utils";
import type { CliRuntime, ReleaseCommand } from "../types/args.types";

type ReleaseListCommanderOptions = {
	limit?: number;
	repo?: string;
};

type ReleaseTagCommanderOptions = {
	message?: string;
	remote?: string;
};

export function registerReleaseCommand(
	program: Command,
	runtime: CliRuntime,
): void {
	const release = program
		.command("release")
		.description("inspect GitHub releases and create release tags");
	release
		.command("list")
		.description("list GitHub releases")
		.option("--limit <N>", "number of releases to list", parsePositiveInt)
		.option("--repo <OWNER/REPO>", "GitHub repository")
		.action(async (options: ReleaseListCommanderOptions) => {
			await runtime.handleReleaseCommand(
				parseListOptions(options),
				runtime.cwd,
			);
		});
	release
		.command("tag")
		.description("create and push a git tag only")
		.argument("<TAG>", "release tag, for example v0.0.1")
		.option("--message <MESSAGE>", "annotated tag message")
		.option("--remote <REMOTE>", "git remote to push to", "origin")
		.action(
			async (
				tag: string,
				options: ReleaseTagCommanderOptions,
				command: Command,
			) => {
				await runtime.handleReleaseCommand(
					parseTagOptions(tag, options, command),
					runtime.cwd,
				);
			},
		);
}

function parseListOptions(
	options: ReleaseListCommanderOptions,
): ReleaseCommand {
	return {
		action: "list",
		...(options.limit === undefined ? {} : { limit: options.limit }),
		...(options.repo === undefined ? {} : { repo: options.repo }),
	};
}

function parseTagOptions(
	tag: string,
	options: ReleaseTagCommanderOptions,
	command: Command,
): ReleaseCommand {
	const normalizedTag = tag.trim();
	if (!normalizedTag) {
		command.error("release tag requires a non-empty tag");
	}
	return {
		action: "tag",
		tag: normalizedTag,
		remote: options.remote ?? "origin",
		...(options.message === undefined ? {} : { message: options.message }),
	};
}
