"use client";

import { type Dispatch, type SetStateAction, useEffect, useRef } from "react";

import type { CommandDraftRequest } from "@/components/web-shell/types/operator-issue-actions.types";

export function useChatRoomDraftState({
	commandDraftRequest,
	setDraft,
	setErrorMessage,
}: {
	commandDraftRequest: CommandDraftRequest | null;
	setDraft: Dispatch<SetStateAction<string>>;
	setErrorMessage: Dispatch<SetStateAction<string | null>>;
}): {
	handleDraftChange: (value: string) => void;
	markCommandDraftHandled: () => void;
} {
	const handledCommandDraftRequest = useRef(0);

	useEffect(() => {
		if (
			!commandDraftRequest ||
			commandDraftRequest.id === handledCommandDraftRequest.current
		) {
			return;
		}
		handledCommandDraftRequest.current = commandDraftRequest.id;
		setDraft(commandDraftRequest.draft);
		setErrorMessage(null);
	}, [commandDraftRequest, setDraft, setErrorMessage]);

	function handleDraftChange(value: string): void {
		setDraft(value);
		setErrorMessage(null);
	}

	function markCommandDraftHandled(): void {
		if (!commandDraftRequest) return;
		handledCommandDraftRequest.current = commandDraftRequest.id;
	}

	return { handleDraftChange, markCommandDraftHandled };
}
