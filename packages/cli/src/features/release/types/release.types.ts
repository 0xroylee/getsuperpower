import type { ReleaseCommand } from "../../../types/args.types";
import type { assertCommandOk, runCommand } from "../../../utils/shell";

export type ReleaseCommandDeps = {
	runCommand?: typeof runCommand;
	assertCommandOk?: typeof assertCommandOk;
};

export type { ReleaseCommand };
