export interface GitHubRepositorySearchResult {
	id: string;
	owner: string;
	name: string;
	fullName: string;
	htmlUrl: string;
	cloneUrl: string;
	defaultBranch: string;
	description: string | null;
	isPrivate: boolean;
}

export interface GitHubRepositorySearchResponse {
	repositories: GitHubRepositorySearchResult[];
}
