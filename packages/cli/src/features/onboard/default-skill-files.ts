import { access, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const DEFAULT_ONBOARD_SKILL_FILES = [
	path.join("piv-brainstorm", "SKILL.md"),
	path.join("piv-plan", "SKILL.md"),
	path.join("piv-implement", "SKILL.md"),
	path.join("piv-review-test", "SKILL.md"),
	path.join("piv-github-comment", "SKILL.md"),
	path.join("adhd-explore", "SKILL.md"),
] as const;

export async function seedDefaultSkillFiles(targetRoot: string): Promise<void> {
	const sourceRoot = await locateBundledSkillsRoot();
	await Promise.all(
		DEFAULT_ONBOARD_SKILL_FILES.map((skillFile) =>
			copyMissingSkillFile(sourceRoot, targetRoot, skillFile),
		),
	);
}

async function copyMissingSkillFile(
	sourceRoot: string,
	targetRoot: string,
	skillFile: string,
): Promise<void> {
	const targetPath = path.join(targetRoot, skillFile);
	if (await pathExists(targetPath)) return;

	await mkdir(path.dirname(targetPath), { recursive: true });
	await copyFile(path.join(sourceRoot, skillFile), targetPath);
}

async function locateBundledSkillsRoot(): Promise<string> {
	for (const candidate of bundledSkillsRootCandidates()) {
		if (await pathExists(path.join(candidate, "piv-plan", "SKILL.md"))) {
			return candidate;
		}
	}
	throw new Error("Bundled default skill files are unavailable");
}

function bundledSkillsRootCandidates(): string[] {
	return [
		path.join(import.meta.dir, "skills"),
		path.resolve(import.meta.dir, "../../../../..", "skills"),
	];
}

async function pathExists(targetPath: string): Promise<boolean> {
	try {
		await access(targetPath);
		return true;
	} catch {
		return false;
	}
}
