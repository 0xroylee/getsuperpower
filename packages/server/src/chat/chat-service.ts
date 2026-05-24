import type { ChatMessageRow, ChatSessionRow } from "devos-db";
import type {
	ChatMessageCreateInput,
	ChatRepository,
	ChatSendInput,
	ChatSendResult,
	ChatService,
	ChatServiceDeps,
	ChatSessionUpdateInput,
} from "./types/chat.types";
import { mapMessage, mapSession, titleFromMessage } from "./chat-mappers";

const UNTITLED_SESSION = "Untitled";

export function createChatService(
	repository: ChatRepository,
	deps: ChatServiceDeps,
): ChatService {
	return {
		async listSessions(workspaceId) {
			return (await repository.listSessions(workspaceId)).map(mapSession);
		},
		async createSession(input) {
			const projectId =
				input.projectId ?? (await deps.ensureDefaultProject()).id;
			const now = new Date().toISOString();
			return mapSession(
				await repository.createSession({
					id: crypto.randomUUID(),
					workspaceId: input.workspaceId,
					projectId,
					title: input.title?.trim() || UNTITLED_SESSION,
					pendingRequest: null,
					pendingQuestions: null,
					createdAt: now,
					updatedAt: now,
				}),
			);
		},
		async updateSession(sessionId, input) {
			const updated = await updateSession(repository, sessionId, input);
			return updated ? mapSession(updated) : null;
		},
		async getMessages(sessionId) {
			const session = await repository.getSession(sessionId);
			if (!session) {
				return null;
			}
			return (await repository.listMessages(sessionId)).map(mapMessage);
		},
		async addMessage(sessionId, input) {
			const session = await repository.getSession(sessionId);
			if (!session) {
				return null;
			}
			const message = await appendMessage(repository, sessionId, input);
			await touchSession(repository, session);
			return mapMessage(message);
		},
		async sendMessage(sessionId, input) {
			return sendMessage(repository, deps, sessionId, input);
		},
	};
}

async function sendMessage(
	repository: ChatRepository,
	deps: ChatServiceDeps,
	sessionId: string,
	input: ChatSendInput,
): Promise<ChatSendResult | null> {
	let session = await repository.getSession(sessionId);
	if (!session) {
		return null;
	}
	if (!session.projectId) {
		const project = await deps.ensureDefaultProject();
		session =
			(await repository.updateSession(sessionId, {
				projectId: project.id,
				updatedAt: new Date().toISOString(),
			})) ?? session;
	}
	const request = input.answers?.length
		? (session.pendingRequest ?? input.content)
		: input.content;
	const userMessage = await appendMessage(repository, sessionId, {
		content: input.content,
		kind: input.answers?.length ? "clarification" : "message",
		metadata: input.answers ? { answers: input.answers } : null,
		role: "user",
	});
	const taskCreate = await deps.runTaskCreate({
		request,
		projectId: session.projectId ?? undefined,
		answers: input.answers,
	});
	const assistantMessage = await appendTaskResultMessage(
		repository,
		sessionId,
		taskCreate,
	);
	session = await updateSessionAfterTask(repository, session, input, taskCreate);
	return {
		session: mapSession(session),
		messages: [userMessage, assistantMessage].map(mapMessage),
		taskCreate,
	};
}

async function updateSessionAfterTask(
	repository: ChatRepository,
	session: ChatSessionRow,
	input: ChatSendInput,
	taskCreate: ChatSendResult["taskCreate"],
): Promise<ChatSessionRow> {
	const update: ChatSessionUpdateInput = {};
	if (session.title === UNTITLED_SESSION && input.content.trim()) {
		update.title = titleFromMessage(input.content);
	}
	if (taskCreate.status === "needs_info") {
		update.pendingRequest = session.pendingRequest ?? input.content;
		update.pendingQuestions = taskCreate.questions;
	} else {
		update.pendingRequest = null;
		update.pendingQuestions = null;
	}
	return (
		(await updateSession(repository, session.id, update)) ??
		(await repository.getSession(session.id)) ??
		session
	);
}

async function appendTaskResultMessage(
	repository: ChatRepository,
	sessionId: string,
	taskCreate: ChatSendResult["taskCreate"],
): Promise<ChatMessageRow> {
	if (taskCreate.status === "needs_info") {
		return appendMessage(repository, sessionId, {
			content: taskCreate.questions.join("\n"),
			kind: "clarification",
			metadata: { questions: taskCreate.questions },
			role: "assistant",
		});
	}
	if (taskCreate.status === "created") {
		return appendMessage(repository, sessionId, {
			content: `Created ${taskCreate.task.taskKey}`,
			kind: "task",
			metadata: { taskKey: taskCreate.task.taskKey },
			role: "assistant",
			taskId: taskCreate.task.id,
		});
	}
	return appendMessage(repository, sessionId, {
		content: taskCreate.error,
		kind: "error",
		role: "assistant",
	});
}

async function appendMessage(
	repository: ChatRepository,
	sessionId: string,
	input: ChatMessageCreateInput,
): Promise<ChatMessageRow> {
	const now = new Date().toISOString();
	return repository.addMessage(sessionId, {
		id: crypto.randomUUID(),
		sessionId,
		role: input.role,
		kind: input.kind ?? "message",
		content: input.content,
		taskId: input.taskId ?? null,
		commandAction: input.commandAction ?? null,
		metadata: input.metadata ? JSON.stringify(input.metadata) : null,
		createdAt: now,
	});
}

async function updateSession(
	repository: ChatRepository,
	sessionId: string,
	input: ChatSessionUpdateInput,
): Promise<ChatSessionRow | null> {
	const update: Partial<ChatSessionRow> = { updatedAt: new Date().toISOString() };
	if (input.title !== undefined) {
		update.title = input.title.trim() || UNTITLED_SESSION;
	}
	if (input.projectId !== undefined) {
		update.projectId = input.projectId;
	}
	if (input.pendingRequest !== undefined) {
		update.pendingRequest = input.pendingRequest;
	}
	if (input.pendingQuestions !== undefined) {
		update.pendingQuestions = input.pendingQuestions
			? JSON.stringify(input.pendingQuestions)
			: null;
	}
	return repository.updateSession(sessionId, update);
}

function touchSession(
	repository: ChatRepository,
	session: ChatSessionRow,
): Promise<ChatSessionRow | null> {
	return repository.updateSession(session.id, {
		updatedAt: new Date().toISOString(),
	});
}
