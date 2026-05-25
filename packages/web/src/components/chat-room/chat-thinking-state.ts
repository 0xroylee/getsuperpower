export interface ChatThinkingStateInput {
	isSending: boolean;
	selectedSessionId: string;
	sendingSessionId?: string;
	streamLineCount: number;
}

export function shouldShowChatThinkingIndicator({
	isSending,
	selectedSessionId,
	sendingSessionId,
	streamLineCount,
}: ChatThinkingStateInput): boolean {
	return (
		isSending &&
		Boolean(selectedSessionId) &&
		sendingSessionId === selectedSessionId &&
		streamLineCount === 0
	);
}
