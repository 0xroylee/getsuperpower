"use client";

import type {
	ProjectBoardTaskRecord,
	TaskActivityRecord,
	TaskActivityResponse,
} from "@/lib/api";
import { useBoardTaskQuery } from "@/lib/api/queries";
import { useTaskActivityQuery } from "@/lib/api/task-activity-query";

import type {
	ChatMissionExecution,
	ChatMissionLogLine,
	ChatMissionProgressViewModel,
	ChatMissionResult,
} from "./types/chat-mission-progress.types";

export function useChatMissionProgress(
	taskId: string | null,
): ChatMissionProgressViewModel | null {
	const taskQuery = useBoardTaskQuery(taskId ?? "", {
		enabled: Boolean(taskId),
	});
	const activityQuery = useTaskActivityQuery(taskId ?? "", {
		enabled: Boolean(taskId),
	});
	if (!taskId) return null;
	if (taskQuery.error || activityQuery.error) {
		return createMissionState(taskId, "error", {
			errorMessage:
				taskQuery.error?.message ??
				activityQuery.error?.message ??
				"Mission progress unavailable.",
		});
	}
	if (taskQuery.isLoading || activityQuery.isLoading || !taskQuery.data) {
		return createMissionState(taskId, "loading");
	}
	return createChatMissionProgressModel({
		activity: activityQuery.data,
		task: taskQuery.data,
	});
}

export function createChatMissionProgressModel({
	activity,
	task,
}: {
	activity?: TaskActivityResponse;
	task: ProjectBoardTaskRecord;
}): ChatMissionProgressViewModel {
	const activities = activity?.activities ?? [];
	const notes = activities
		.filter((item) => item.kind === "comment" && item.body.trim())
		.map((item) => ({
			id: item.id,
			actorId: item.actorId,
			body: item.body,
			createdAt: item.createdAt,
			title: item.title,
		}));
	const executions = activities
		.filter((item) => item.kind === "execution")
		.map(createMissionExecution);
	return {
		state: "ready",
		taskId: task.id,
		taskKey: task.taskKey,
		title: task.title,
		status: task.status,
		statusLabel: formatStatusLabel(task.status),
		updatedAt: task.updatedAt,
		notes,
		executions,
		latestResult: createLatestResult(executions),
	};
}

function createMissionState(
	taskId: string,
	state: "loading" | "error",
	overrides: Partial<ChatMissionProgressViewModel> = {},
): ChatMissionProgressViewModel {
	return {
		state,
		taskId,
		taskKey: "",
		title: "",
		status: "",
		statusLabel: state === "loading" ? "Loading" : "Unavailable",
		updatedAt: "",
		notes: [],
		executions: [],
		latestResult: null,
		...overrides,
	};
}

function createMissionExecution(
	activity: TaskActivityRecord,
): ChatMissionExecution {
	return {
		id: activity.id,
		body: activity.body,
		logLines: parseLogLines(activity.id, activity.body),
		startedAt: activity.createdAt,
		status: activity.status,
		steps: activity.steps ?? [],
		title: activity.title,
	};
}

function parseLogLines(
	executionId: string,
	body: string,
): ChatMissionLogLine[] {
	return body
		.split(/\r?\n/)
		.map((line, index) => parseLogLine(executionId, line, index))
		.filter((line) => line.text.trim().length > 0);
}

function parseLogLine(
	executionId: string,
	line: string,
	index: number,
): ChatMissionLogLine {
	const match = line.match(/^\[[^\]]+\s+(stdout|stderr)\]\s?(.*)$/);
	if (!match) {
		return { id: `${executionId}:${index}`, stream: "system", text: line };
	}
	return {
		id: `${executionId}:${index}`,
		stream: match[1] === "stderr" ? "stderr" : "stdout",
		text: match[2] ?? "",
	};
}

function createLatestResult(
	executions: ChatMissionExecution[],
): ChatMissionResult | null {
	const latest = executions.at(-1);
	if (!latest?.status) return null;
	const status = latest.status.toLowerCase();
	if (["success", "succeeded", "done", "completed"].includes(status)) {
		return { label: latest.status, tone: "success" };
	}
	if (["failed", "failure", "error", "rejected"].includes(status)) {
		return { label: latest.status, tone: "error" };
	}
	if (["running", "started", "queued"].includes(status)) {
		return { label: latest.status, tone: "running" };
	}
	return { label: latest.status, tone: "neutral" };
}

function formatStatusLabel(status: string): string {
	return status
		.replace(/[_-]+/g, " ")
		.replace(/\b\w/g, (character) => character.toUpperCase());
}
