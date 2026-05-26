"use client";

import { useState } from "react";

interface TaskDetailPanelTarget {
	sessionId: string;
	taskId: string;
}

interface UseChatTaskDetailPanelStateInput {
	activeTaskId: string | null;
	selectedSessionId: string;
}

interface UseChatTaskDetailPanelStateResult {
	isOpen: boolean;
	close: () => void;
	toggle: () => void;
}

export function useChatTaskDetailPanelState({
	activeTaskId,
	selectedSessionId,
}: UseChatTaskDetailPanelStateInput): UseChatTaskDetailPanelStateResult {
	const [target, setTarget] = useState<TaskDetailPanelTarget | null>(null);
	const isOpen = Boolean(
		activeTaskId &&
			target?.sessionId === selectedSessionId &&
			target.taskId === activeTaskId,
	);

	function close(): void {
		setTarget(null);
	}

	function toggle(): void {
		if (!activeTaskId || isOpen) {
			close();
			return;
		}
		setTarget({ sessionId: selectedSessionId, taskId: activeTaskId });
	}

	return { isOpen, close, toggle };
}
