import type { ServerDatabase } from "devos-db";
import { z } from "zod";
import { createChatRepository, createChatService } from "../chat";
import { ensureLocalDefaultProject, LOCAL_WORKSPACE_ID } from "../local-workspace";
import type { RealtimeEventPublisher } from "../realtime";
import { createTaskRepository, createTaskService } from "../tasks";
import {
	composeTaskChatCreate,
	runTaskIntake,
} from "../tasks/task-chat-service";
import type { CliExecutor } from "../types/app.types";
import {
	badRequest,
	methodNotAllowed,
	notFound,
	parseObjectJsonBody,
} from "./http-utils";
import { jsonSuccess } from "./response";

const SESSIONS_PATH = "/api/chat/sessions";
const SESSION_PATH = /^\/api\/chat\/sessions\/([^/]+)\/?$/;
const MESSAGES_PATH = /^\/api\/chat\/sessions\/([^/]+)\/messages\/?$/;
const SEND_PATH = /^\/api\/chat\/sessions\/([^/]+)\/send\/?$/;

const answerSchema = z.object({
	question: z.string().trim().min(1),
	answer: z.string().trim().min(1),
});

const sessionCreateSchema = z.object({
	workspaceId: z.string().trim().min(1).optional(),
	projectId: z.string().trim().min(1).nullable().optional(),
	title: z.string().trim().min(1).optional(),
});

const sessionUpdateSchema = z.object({
	projectId: z.string().trim().min(1).nullable().optional(),
	title: z.string().trim().min(1).optional(),
	pendingRequest: z.string().nullable().optional(),
	pendingQuestions: z.array(z.string().trim().min(1)).nullable().optional(),
});

const messageCreateSchema = z.object({
	role: z.enum(["user", "assistant", "system"]),
	kind: z
		.enum(["message", "clarification", "task", "command", "error"])
		.optional(),
	content: z.string().trim().min(1),
	taskId: z.string().trim().min(1).nullable().optional(),
	commandAction: z.string().trim().min(1).nullable().optional(),
	metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

const sendMessageSchema = z.object({
	content: z.string().trim().min(1),
	answers: z.array(answerSchema).optional(),
});

export async function handleChatRoute(
	request: Request,
	db: ServerDatabase["db"],
	cliExecutor: CliExecutor,
	pathname: string,
	workspacePath: string,
	realtimeEvents?: RealtimeEventPublisher,
): Promise<Response | null> {
	const service = createChatRouteService(
		db,
		cliExecutor,
		workspacePath,
		realtimeEvents,
	);
	if (pathname === SESSIONS_PATH) {
		return handleSessionsRoute(request, service);
	}
	const sendMatch = pathname.match(SEND_PATH);
	if (sendMatch?.[1]) {
		return handleSendRoute(request, service, decodeURIComponent(sendMatch[1]));
	}
	const messagesMatch = pathname.match(MESSAGES_PATH);
	if (messagesMatch?.[1]) {
		return handleMessagesRoute(
			request,
			service,
			decodeURIComponent(messagesMatch[1]),
		);
	}
	const sessionMatch = pathname.match(SESSION_PATH);
	if (sessionMatch?.[1]) {
		return handleSessionRoute(
			request,
			service,
			decodeURIComponent(sessionMatch[1]),
		);
	}
	return null;
}

function createChatRouteService(
	db: ServerDatabase["db"],
	cliExecutor: CliExecutor,
	workspacePath: string,
	realtimeEvents?: RealtimeEventPublisher,
) {
	const taskService = createTaskService(createTaskRepository(db));
	return createChatService(createChatRepository(db), {
		ensureDefaultProject: () => ensureLocalDefaultProject(db, workspacePath),
		runTaskCreate: async (input) => {
			const result = await composeTaskChatCreate(input, {
				runTaskIntake: (request) => runTaskIntake(cliExecutor, request),
				persistCreatedTask: async (request, task) => {
					const persisted = await taskService.ensureChatCreatedTask(
						request,
						task,
					);
					if (persisted.status !== "ok") {
						throw new Error("Invalid task create payload");
					}
					return persisted.value;
				},
			});
			if (result.status === "created") {
				realtimeEvents?.publish({ type: "issue.created", issue: result.task });
			}
			return result;
		},
	});
}

async function handleSessionsRoute(
	request: Request,
	service: ReturnType<typeof createChatRouteService>,
): Promise<Response> {
	if (request.method === "GET") {
		const workspaceId =
			new URL(request.url).searchParams.get("workspaceId") ??
			LOCAL_WORKSPACE_ID;
		return jsonSuccess(await service.listSessions(workspaceId));
	}
	if (request.method !== "POST") {
		return methodNotAllowed();
	}
	const parsed = await parseBody(request, sessionCreateSchema);
	if (!parsed.ok) {
		return badRequest(parsed.error);
	}
	return jsonSuccess(
		await service.createSession({
			...parsed.value,
			workspaceId: parsed.value.workspaceId ?? LOCAL_WORKSPACE_ID,
		}),
		{ status: 201 },
	);
}

async function handleSessionRoute(
	request: Request,
	service: ReturnType<typeof createChatRouteService>,
	sessionId: string,
): Promise<Response> {
	if (request.method !== "PATCH") {
		return methodNotAllowed();
	}
	const parsed = await parseBody(request, sessionUpdateSchema);
	if (!parsed.ok) {
		return badRequest(parsed.error);
	}
	const session = await service.updateSession(sessionId, parsed.value);
	return session ? jsonSuccess(session) : notFound("Chat session not found");
}

async function handleMessagesRoute(
	request: Request,
	service: ReturnType<typeof createChatRouteService>,
	sessionId: string,
): Promise<Response> {
	if (request.method === "GET") {
		const messages = await service.getMessages(sessionId);
		return messages ? jsonSuccess(messages) : notFound("Chat session not found");
	}
	if (request.method !== "POST") {
		return methodNotAllowed();
	}
	const parsed = await parseBody(request, messageCreateSchema);
	if (!parsed.ok) {
		return badRequest(parsed.error);
	}
	const message = await service.addMessage(sessionId, parsed.value);
	return message
		? jsonSuccess(message, { status: 201 })
		: notFound("Chat session not found");
}

async function handleSendRoute(
	request: Request,
	service: ReturnType<typeof createChatRouteService>,
	sessionId: string,
): Promise<Response> {
	if (request.method !== "POST") {
		return methodNotAllowed();
	}
	const parsed = await parseBody(request, sendMessageSchema);
	if (!parsed.ok) {
		return badRequest(parsed.error);
	}
	const result = await service.sendMessage(sessionId, parsed.value);
	return result ? jsonSuccess(result) : notFound("Chat session not found");
}

async function parseBody<T extends z.ZodTypeAny>(
	request: Request,
	schema: T,
): Promise<
	| { ok: true; value: z.infer<T> }
	| { ok: false; error: string }
> {
	const body = await parseObjectJsonBody(request);
	if (!body.ok) {
		return body;
	}
	const parsed = schema.safeParse(body.value);
	return parsed.success
		? { ok: true, value: parsed.data }
		: { ok: false, error: "Invalid chat payload" };
}
