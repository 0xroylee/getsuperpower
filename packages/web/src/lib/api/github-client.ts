import {
	assertObjectRecord,
	parseListResponse,
	readBoolean,
	readNullableString,
	readString,
} from "./response-utils";
import type {
	GitHubRepositorySearchResponse,
	GitHubRepositorySearchResult,
	HealthRequestOptions,
} from "./types/client.types";

const ENDPOINT = "/api/github/repositories/search";

export function parseGitHubRepositorySearchResult(
	payload: unknown,
): GitHubRepositorySearchResult {
	const row = assertObjectRecord(payload, ENDPOINT);
	return {
		id: readString(row, "id", ENDPOINT),
		owner: readString(row, "owner", ENDPOINT),
		name: readString(row, "name", ENDPOINT),
		fullName: readString(row, "fullName", ENDPOINT),
		htmlUrl: readString(row, "htmlUrl", ENDPOINT),
		cloneUrl: readString(row, "cloneUrl", ENDPOINT),
		defaultBranch: readString(row, "defaultBranch", ENDPOINT),
		description: readNullableString(row, "description", ENDPOINT),
		isPrivate: readBoolean(row, "isPrivate", ENDPOINT),
	};
}

function parseGitHubRepositorySearchResponse(
	payload: unknown,
): GitHubRepositorySearchResponse {
	const row = assertObjectRecord(payload, ENDPOINT);
	return {
		repositories: parseListResponse(
			row.repositories,
			`${ENDPOINT}:repositories`,
			parseGitHubRepositorySearchResult,
		),
	};
}

export interface GitHubApiMethods {
	searchGitHubRepositories(
		query: string,
		options?: HealthRequestOptions,
	): Promise<GitHubRepositorySearchResult[]>;
}

export function createGitHubApiMethods(
	requestWithBase: (
		path: string,
		method: "GET" | "POST" | "PATCH" | "DELETE",
		options?: HealthRequestOptions,
		body?: unknown,
	) => Promise<unknown>,
): GitHubApiMethods {
	return {
		async searchGitHubRepositories(query, options) {
			const trimmed = query.trim();
			const payload = await requestWithBase(
				`${ENDPOINT}?q=${encodeURIComponent(trimmed)}`,
				"GET",
				options,
			);
			return parseGitHubRepositorySearchResponse(payload).repositories;
		},
	};
}
