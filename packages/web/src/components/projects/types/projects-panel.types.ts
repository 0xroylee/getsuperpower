import type {
	GitHubRepositorySearchResult,
	ProjectUpdateRequest,
	WorkspaceProjectRecord,
} from "@/lib/api";

export interface ProjectRepositorySelection {
	owner: string;
	name: string;
	fullName: string;
	defaultBranch: string;
}

export interface ProjectFormState {
	name: string;
	externalProjectId: string;
	description: string;
	repositoryQuery: string;
	repositorySelection: ProjectRepositorySelection | null;
	localFolder: string;
	lead: string;
	category: string;
	priority: string;
}

export interface ProjectCreateDefaults {
	boardId: string;
	ownerId: string;
}

export interface ProjectFormRequestPayload extends ProjectUpdateRequest {
	name: string;
}

export type ProjectDialogMode = "create" | "edit";
export type ProjectFormFieldName = Exclude<
	keyof ProjectFormState,
	"repositorySelection"
>;

export interface ProjectFieldConfig {
	name: ProjectFormFieldName;
	label: string;
	placeholder?: string;
	type?: "number" | "text";
}

export interface ProjectFieldGroup {
	title: string;
	fields: ProjectFieldConfig[];
}

export type ProjectTableDensity = "compact" | "comfortable";

export interface ProjectDisplayRow {
	project: WorkspaceProjectRecord;
	priorityLabel: string;
	categoryLabel: string;
	repositoryLabel: string;
	leadLabel: string;
	createdLabel: string;
	summaryLabel: string;
}

export interface ProjectRepositoryPickerResult
	extends GitHubRepositorySearchResult {}
