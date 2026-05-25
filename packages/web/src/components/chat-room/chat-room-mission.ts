"use client";

import type { ChatMessageRecord, ChatSessionRecord } from "@/lib/api";

import { useChatMissionProgress } from "./chat-mission-progress-state";
import { findActiveTaskId } from "./chat-task-utils";
import type { ChatMissionProgressViewModel } from "./types/chat-mission-progress.types";

export function useChatRoomMission(
	session: ChatSessionRecord | null,
	messages: ChatMessageRecord[],
): {
	activeTaskId: string | null;
	missionProgress: ChatMissionProgressViewModel | null;
} {
	const activeTaskId = findActiveTaskId(session, messages);
	return {
		activeTaskId,
		missionProgress: useChatMissionProgress(activeTaskId),
	};
}
