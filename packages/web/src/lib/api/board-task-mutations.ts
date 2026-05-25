"use client";

import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { serverStateQueryKeys } from "./query-keys";
import type { ProjectBoardTaskRecord } from "./types/client.types";
import type {
	BoardTaskMutationInput,
	BoardTaskUpdateMutationInput,
} from "./types/queries.types";
import { createWebApiClient } from "./web-client";

const apiClient = createWebApiClient();

export function useCreateBoardTaskMutation(): UseMutationResult<
	ProjectBoardTaskRecord,
	Error,
	BoardTaskMutationInput
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: ["board-task", "create"] as const,
		mutationFn: (input) => apiClient.createBoardTask(input),
		onSuccess: async (createdTask) => {
			upsertBoardTask(queryClient, createdTask);
			await queryClient.invalidateQueries({
				queryKey: serverStateQueryKeys.boardTasks,
			});
			await queryClient.invalidateQueries({
				queryKey: serverStateQueryKeys.boardTask(createdTask.id),
			});
		},
	});
}

export function useUpdateBoardTaskMutation(): UseMutationResult<
	ProjectBoardTaskRecord,
	Error,
	BoardTaskUpdateMutationInput
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: ["board-task", "update"] as const,
		mutationFn: (input) => apiClient.updateBoardTask(input.taskId, input.task),
		onSuccess: async (updatedTask, input) => {
			upsertBoardTask(queryClient, updatedTask);
			await queryClient.invalidateQueries({
				queryKey: serverStateQueryKeys.boardTasks,
			});
			await queryClient.invalidateQueries({
				queryKey: serverStateQueryKeys.boardTask(updatedTask.id),
			});
			await queryClient.invalidateQueries({
				queryKey: serverStateQueryKeys.taskActivity(input.taskId),
			});
		},
	});
}

function upsertBoardTask(
	queryClient: ReturnType<typeof useQueryClient>,
	task: ProjectBoardTaskRecord,
): void {
	queryClient.setQueryData(serverStateQueryKeys.boardTask(task.id), task);
	queryClient.setQueryData<ProjectBoardTaskRecord[]>(
		serverStateQueryKeys.boardTasks,
		(current = []) => {
			const exists = current.some((item) => item.id === task.id);
			return exists
				? current.map((item) => (item.id === task.id ? task : item))
				: [...current, task];
		},
	);
}

export function useDeleteBoardTaskMutation(): UseMutationResult<
	ProjectBoardTaskRecord,
	Error,
	string
> {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: ["board-task", "delete"] as const,
		mutationFn: (taskId) => apiClient.deleteBoardTask(taskId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: serverStateQueryKeys.boardTasks,
			});
		},
	});
}
