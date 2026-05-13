import { describe, expect, it } from "bun:test";
import { createHandleRequest, handleRequest } from "../src/app";
import type { AppDeps, BoardReadModels, CliExecutor } from "../src/app.types";

function createCliExecutor(): CliExecutor {
	return {
		execute: async () => ({
			status: "rejected",
			reason: "unsupported",
			request: { action: "unknown" },
		}),
		getHistory: () => [],
	};
}

function createDeps(boardReadModels: BoardReadModels): AppDeps {
	return {
		cliExecutor: createCliExecutor(),
		boardReadModels,
	};
}

describe("board routes", () => {
	it("returns workspace projects through createHandleRequest", async () => {
		const app = createHandleRequest(
			createDeps({
				listWorkspaceProjects: async (workspaceId) => [
					{
						id: "project-1",
						boardId: "board-1",
						externalProjectId: workspaceId,
						name: "Project 1",
						description: null,
						ownerId: "owner-1",
						createdAt: "2026-05-14T00:00:00.000Z",
						updatedAt: "2026-05-14T00:00:00.000Z",
					},
				],
				getProjectBoard: async () => ({
					id: "board-1",
					name: "Board 1",
					description: null,
					ownerId: "owner-1",
					createdAt: "2026-05-14T00:00:00.000Z",
					updatedAt: "2026-05-14T00:00:00.000Z",
					projects: [],
					tasks: [],
				}),
			}),
		);
		const response = await app(
			new Request("http://localhost/api/workspaces/ws-1/projects", {
				method: "GET",
			}),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([
			{
				id: "project-1",
				boardId: "board-1",
				externalProjectId: "ws-1",
				name: "Project 1",
				description: null,
				ownerId: "owner-1",
				createdAt: "2026-05-14T00:00:00.000Z",
				updatedAt: "2026-05-14T00:00:00.000Z",
			},
		]);
	});

	it("returns project board through createHandleRequest", async () => {
		const app = createHandleRequest(
			createDeps({
				listWorkspaceProjects: async () => [],
				getProjectBoard: async (workspaceId, projectId) => ({
					id: `board-${projectId}`,
					name: "Board",
					description: workspaceId,
					ownerId: "owner-1",
					createdAt: "2026-05-14T00:00:00.000Z",
					updatedAt: "2026-05-14T00:00:00.000Z",
					projects: [],
					tasks: [],
				}),
			}),
		);
		const response = await app(
			new Request(
				"http://localhost/api/workspaces/ws-1/projects/proj-1/board",
				{
					method: "GET",
				},
			),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			id: "board-proj-1",
			name: "Board",
			description: "ws-1",
			ownerId: "owner-1",
			createdAt: "2026-05-14T00:00:00.000Z",
			updatedAt: "2026-05-14T00:00:00.000Z",
			projects: [],
			tasks: [],
		});
	});

	it("routes board endpoints through handleRequest and returns 200", async () => {
		const projectsResponse = await handleRequest(
			new Request("http://localhost/api/workspaces/ws-1/projects", {
				method: "GET",
			}),
		);
		const boardResponse = await handleRequest(
			new Request(
				"http://localhost/api/workspaces/ws-1/projects/proj-1/board",
				{
					method: "GET",
				},
			),
		);

		expect(projectsResponse.status).toBe(200);
		expect(boardResponse.status).toBe(200);
		expect(await projectsResponse.json()).toEqual([]);
		expect(await boardResponse.json()).toEqual({
			id: "board-proj-1",
			name: "Project Board",
			description: null,
			ownerId: "system",
			createdAt: "1970-01-01T00:00:00.000Z",
			updatedAt: "1970-01-01T00:00:00.000Z",
			projects: [],
			tasks: [],
		});
	});
});
