import { resolvePlanningStatusLabel } from "./chat-mission-phase-labels";

export interface ChatThinkingStateInput {
	isSending: boolean;
	hasLoadingStream: boolean;
	selectedSessionId: string;
	sendingSessionId?: string;
	streamLineCount: number;
}

export interface ChatPlanningStateInput {
	hasMissionProgress: boolean;
	taskStatus?: string | null;
}

export function shouldShowChatThinkingIndicator({
	hasLoadingStream,
	isSending,
	selectedSessionId,
	sendingSessionId,
	streamLineCount,
}: ChatThinkingStateInput): boolean {
	if (!selectedSessionId || streamLineCount > 0) return false;
	return (
		hasLoadingStream || (isSending && sendingSessionId === selectedSessionId)
	);
}

export function shouldShowChatPlanningIndicator({
	hasMissionProgress,
	taskStatus,
}: ChatPlanningStateInput): boolean {
	if (hasMissionProgress || !taskStatus) return false;
	return isPlanningTaskStatus(taskStatus);
}

function isPlanningTaskStatus(status: string): boolean {
	return Boolean(resolvePlanningStatusLabel(status));
}
