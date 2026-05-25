import type { ChatSessionRecord } from "@/lib/api";

export function selectChatSession(
	sessions: ChatSessionRecord[],
	activeSessionId: string,
): {
	selectedSession: ChatSessionRecord | null;
	selectedSessionId: string;
} {
	const selectedSessionId =
		sessions.find((session) => session.id === activeSessionId)?.id ??
		sessions[0]?.id ??
		"";
	return {
		selectedSession:
			sessions.find((session) => session.id === selectedSessionId) ?? null,
		selectedSessionId,
	};
}
