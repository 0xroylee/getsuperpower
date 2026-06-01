import type {
	ProjectCreateRequest,
	ProjectUpdateRequest,
	WorkspaceProjectRecord,
} from "@/lib/api";
import type {
	ProjectCreateDefaults,
	ProjectFieldGroup,
	ProjectFormRequestPayload,
	ProjectFormState,
	ProjectRepositoryPickerResult,
	ProjectRepositorySelection,
} from "./types/projects-panel.types";

export const EMPTY_PROJECT_FORM_STATE: ProjectFormState = {
	name: "",
	externalProjectId: "",
	description: "",
	repositoryQuery: "",
	repositorySelection: null,
	localFolder: "",
	lead: "",
	category: "",
	priority: "",
};

export const PROJECT_FORM_FIELD_GROUPS: ProjectFieldGroup[] = [
	{
		title: "Identity",
		fields: [
			{ name: "name", label: "Project name" },
			{ name: "externalProjectId", label: "External project ID" },
			{ name: "description", label: "Description" },
		],
	},
	{
		title: "Repository",
		fields: [
			{
				name: "repositoryQuery",
				label: "Repository",
				placeholder: "owner/repo or GitHub URL",
			},
			{ name: "localFolder", label: "Local folder" },
		],
	},
	{
		title: "Ownership",
		fields: [
			{ name: "lead", label: "Lead" },
			{ name: "category", label: "Category" },
			{ name: "priority", label: "Priority", type: "number" },
		],
	},
];

export function buildProjectCreateRequest(
	form: ProjectFormState,
	defaults: ProjectCreateDefaults,
): ProjectCreateRequest {
	const payload = buildProjectFormRequestPayload(form);
	return {
		boardId: defaults.boardId,
		ownerId: defaults.ownerId,
		...payload,
	};
}

export function buildProjectUpdateRequest(
	form: ProjectFormState,
): ProjectUpdateRequest {
	return buildProjectFormRequestPayload(form);
}

export function formStateFromProject(
	project: WorkspaceProjectRecord,
): ProjectFormState {
	const hasRepository = Boolean(project.repoOwner && project.repoName);
	const fullName = hasRepository
		? `${project.repoOwner}/${project.repoName}`
		: "";
	return {
		name: project.name,
		externalProjectId: project.externalProjectId ?? "",
		description: project.description ?? "",
		repositoryQuery: fullName,
		repositorySelection: hasRepository
			? {
					owner: project.repoOwner ?? "",
					name: project.repoName ?? "",
					fullName,
					defaultBranch: project.baseBranch ?? "main",
				}
			: null,
		localFolder: project.localFolder ?? "",
		lead: project.lead ?? "",
		category: project.category ?? "",
		priority: project.priority === null ? "" : String(project.priority),
	};
}

export function repositorySelectionFromSearchResult(
	result: ProjectRepositoryPickerResult,
): ProjectRepositorySelection {
	return {
		owner: result.owner,
		name: result.name,
		fullName: result.fullName,
		defaultBranch: result.defaultBranch,
	};
}

function buildProjectFormRequestPayload(
	form: ProjectFormState,
): ProjectFormRequestPayload {
	const name = form.name.trim();
	if (!name) {
		throw new Error("Project name is required");
	}
	const repository = resolveRepositoryInput(form);
	return {
		name,
		externalProjectId: optionalText(form.externalProjectId),
		description: optionalText(form.description),
		repoOwner: repository?.owner ?? null,
		repoName: repository?.name ?? null,
		baseBranch: repository?.defaultBranch ?? null,
		localFolder: optionalText(form.localFolder),
		lead: optionalText(form.lead),
		category: optionalText(form.category),
		priority: optionalPriority(form.priority),
	};
}

function resolveRepositoryInput(
	form: ProjectFormState,
): { owner: string; name: string; defaultBranch: string } | null {
	if (form.repositorySelection) {
		return {
			owner: form.repositorySelection.owner,
			name: form.repositorySelection.name,
			defaultBranch: form.repositorySelection.defaultBranch,
		};
	}
	const parsed = parseGitHubRepositoryInput(form.repositoryQuery);
	return parsed
		? { owner: parsed.owner, name: parsed.name, defaultBranch: "main" }
		: null;
}

function parseGitHubRepositoryInput(
	value: string,
): { owner: string; name: string } | null {
	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}
	const match =
		/^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?$/.exec(trimmed) ??
		/^git@github\.com:([^/\s]+)\/([^/\s]+?)(?:\.git)?$/.exec(trimmed) ??
		/^ssh:\/\/git@github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?$/.exec(
			trimmed,
		) ??
		/^([^/\s]+)\/([^/\s]+)$/.exec(trimmed);
	if (!match) {
		throw new Error(
			"Repository must be selected from search or entered as owner/repo",
		);
	}
	return { owner: match[1], name: match[2] };
}

function optionalText(value: string): string | null {
	const trimmed = value.trim();
	return trimmed || null;
}

function optionalPriority(value: string): number | null {
	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}
	const parsed = Number(trimmed);
	if (!Number.isInteger(parsed)) {
		throw new Error("Priority must be an integer");
	}
	return parsed;
}
