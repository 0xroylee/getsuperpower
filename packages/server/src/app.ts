import type { AppDeps, RouteHandler } from "./app.types";

const UNSAFE_RAW_COMMAND_FIELDS = ["command", "cmd", "args", "argv", "shell"];
const WORKSPACE_PROJECTS_PATTERN =
	/^\/api\/workspaces\/([^/]+)\/projects(?:\/)?$/;
const PROJECT_BOARD_PATTERN =
	/^\/api\/workspaces\/([^/]+)\/projects\/([^/]+)\/board(?:\/)?$/;

export function createHandleRequest(deps: AppDeps): RouteHandler {
	const boardReadModels = deps.boardReadModels;

	return async (request) => {
		const { pathname } = new URL(request.url);
		const workspaceProjectsMatch = pathname.match(WORKSPACE_PROJECTS_PATTERN);
		const projectBoardMatch = pathname.match(PROJECT_BOARD_PATTERN);

		if (pathname === "/health" && request.method === "GET") {
			return Response.json({ status: "ok" });
		}
		if (workspaceProjectsMatch) {
			if (request.method !== "GET") {
				return Response.json({ error: "Method Not Allowed" }, { status: 405 });
			}
			if (!boardReadModels) {
				return Response.json(
					{ error: "Board read models not configured" },
					{ status: 500 },
				);
			}
			const workspaceId = decodeURIComponent(workspaceProjectsMatch[1] ?? "");
			return Response.json(
				await boardReadModels.listWorkspaceProjects(workspaceId),
			);
		}
		if (projectBoardMatch) {
			if (request.method !== "GET") {
				return Response.json({ error: "Method Not Allowed" }, { status: 405 });
			}
			if (!boardReadModels) {
				return Response.json(
					{ error: "Board read models not configured" },
					{ status: 500 },
				);
			}
			const workspaceId = decodeURIComponent(projectBoardMatch[1] ?? "");
			const projectId = decodeURIComponent(projectBoardMatch[2] ?? "");
			return Response.json(
				await boardReadModels.getProjectBoard(workspaceId, projectId),
			);
		}

		if (pathname === "/api/cli/history") {
			if (request.method !== "GET") {
				return Response.json({ error: "Method Not Allowed" }, { status: 405 });
			}
			return Response.json(deps.cliExecutor.getHistory());
		}

		if (pathname === "/api/cli/dispatch") {
			if (request.method !== "POST") {
				return Response.json({ error: "Method Not Allowed" }, { status: 405 });
			}
			const parsed = await parseDispatchRequest(request);
			if (parsed.status === "error") {
				return Response.json({ error: parsed.error }, { status: 400 });
			}
			const result = await deps.cliExecutor.execute(parsed.request);
			return Response.json(result, {
				status: result.status === "rejected" ? 400 : 200,
			});
		}

		return new Response("Not Found", { status: 404 });
	};
}

export const handleRequest: RouteHandler = async (request) => {
	const { pathname } = new URL(request.url);

	if (pathname === "/health" && request.method === "GET") {
		return Response.json({ status: "ok" });
	}

	return new Response("Not Found", { status: 404 });
};

async function parseDispatchRequest(
	request: Request,
): Promise<
	| { status: "ok"; request: Record<string, unknown> & { action: string } }
	| { status: "error"; error: string }
> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return { status: "error", error: "Malformed JSON body" };
	}

	if (!isRecord(body)) {
		return {
			status: "error",
			error: "Malformed dispatch request: expected object body",
		};
	}
	if (typeof body.action !== "string" || body.action.trim().length === 0) {
		return {
			status: "error",
			error: "Malformed dispatch request: action must be a non-empty string",
		};
	}
	for (const field of UNSAFE_RAW_COMMAND_FIELDS) {
		if (field in body) {
			return {
				status: "error",
				error: `Unsafe dispatch request: raw command field '${field}' is not allowed`,
			};
		}
	}

	return {
		status: "ok",
		request: body as Record<string, unknown> & { action: string },
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
