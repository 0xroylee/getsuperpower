import type { WorkspaceProjectRecord } from "@/lib/api";
import type { ProjectDisplayRow } from "./types/projects-panel.types";

const EMPTY_LABEL = "--";

export function filterProjects(
	projects: WorkspaceProjectRecord[],
	searchQuery: string,
): WorkspaceProjectRecord[] {
	const query = searchQuery.trim().toLowerCase();
	if (!query) {
		return projects;
	}
	return projects.filter((project) =>
		projectSearchText(project).toLowerCase().includes(query),
	);
}

export function buildProjectDisplayRows(
	projects: WorkspaceProjectRecord[],
	now = new Date(),
): ProjectDisplayRow[] {
	return projects.map((project) => ({
		project,
		priorityLabel: formatProjectPriority(project.priority),
		categoryLabel: formatOptionalLabel(project.category),
		repositoryLabel: formatProjectRepository(project),
		leadLabel: formatOptionalLabel(project.lead),
		createdLabel: formatProjectCreatedAt(project.createdAt, now),
		summaryLabel:
			formatOptionalLabel(project.description) === EMPTY_LABEL
				? project.id
				: formatOptionalLabel(project.description),
	}));
}

export function formatProjectPriority(priority: number | null): string {
	return priority === null ? EMPTY_LABEL : `P${priority}`;
}

export function formatProjectRepository(
	project: Pick<WorkspaceProjectRecord, "repoName" | "repoOwner">,
): string {
	const owner = project.repoOwner?.trim();
	const repo = project.repoName?.trim();
	if (owner && repo) {
		return `${owner}/${repo}`;
	}
	return owner || repo || EMPTY_LABEL;
}

export function formatProjectCreatedAt(
	createdAt: string,
	now = new Date(),
): string {
	const createdDate = new Date(createdAt);
	if (Number.isNaN(createdDate.getTime())) {
		return EMPTY_LABEL;
	}
	const elapsedMs = Math.max(0, now.getTime() - createdDate.getTime());
	const elapsedSeconds = Math.floor(elapsedMs / 1000);
	if (elapsedSeconds < 60) {
		return "Just now";
	}
	const elapsedMinutes = Math.floor(elapsedSeconds / 60);
	if (elapsedMinutes < 60) {
		return `${elapsedMinutes}m ago`;
	}
	const elapsedHours = Math.floor(elapsedMinutes / 60);
	if (elapsedHours < 24) {
		return `${elapsedHours}h ago`;
	}
	const elapsedDays = Math.floor(elapsedHours / 24);
	if (elapsedDays < 7) {
		return `${elapsedDays}d ago`;
	}
	const elapsedWeeks = Math.floor(elapsedDays / 7);
	if (elapsedWeeks < 5) {
		return `${elapsedWeeks}w ago`;
	}
	const elapsedMonths = Math.floor(elapsedDays / 30);
	if (elapsedMonths < 12) {
		return `${elapsedMonths}mo ago`;
	}
	return `${Math.floor(elapsedDays / 365)}y ago`;
}

function formatOptionalLabel(value: string | null): string {
	return value?.trim() || EMPTY_LABEL;
}

function projectSearchText(project: WorkspaceProjectRecord): string {
	return [
		project.name,
		project.description,
		project.externalProjectId,
		project.repoOwner,
		project.repoName,
		project.baseBranch,
		project.localFolder,
		project.lead,
		project.category,
		project.priority === null ? null : String(project.priority),
	]
		.filter(Boolean)
		.join(" ");
}
