"use client";

import { Plus, RefreshCw } from "lucide-react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import type { WorkspaceProjectRecord } from "@/lib/api";
import {
	useCreateProjectMutation,
	useCurrentWorkspaceQuery,
	useUpdateProjectMutation,
} from "@/lib/api/queries";
import { useWorkspaceProjectsQuery } from "@/lib/api/realtime-queries";

import { ProjectFormDialog } from "./project-form-dialog";
import {
	EMPTY_PROJECT_FORM_STATE,
	buildProjectCreateRequest,
	buildProjectUpdateRequest,
	formStateFromProject,
} from "./project-form-utils";
import {
	buildProjectDisplayRows,
	filterProjects,
} from "./projects-panel-utils";
import { ProjectsTable } from "./projects-table";
import { ProjectsToolbar } from "./projects-toolbar";
import type {
	ProjectDialogMode,
	ProjectFormFieldName,
	ProjectRepositorySelection,
	ProjectTableDensity,
} from "./types/projects-panel.types";

export function ProjectsPanel(): ReactElement {
	const [form, setForm] = useState(EMPTY_PROJECT_FORM_STATE);
	const [formError, setFormError] = useState<string | null>(null);
	const [dialogMode, setDialogMode] = useState<ProjectDialogMode | null>(null);
	const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [density, setDensity] = useState<ProjectTableDensity>("compact");
	const currentWorkspaceQuery = useCurrentWorkspaceQuery({
		refetchIntervalMs: false,
	});
	const workspaceId = currentWorkspaceQuery.data?.workspaceId ?? "";
	const projectsQuery = useWorkspaceProjectsQuery(workspaceId, {
		refetchIntervalMs: false,
	});
	const createProject = useCreateProjectMutation();
	const updateProject = useUpdateProjectMutation();
	const projects = projectsQuery.data ?? [];
	const filteredProjects = useMemo(
		() => filterProjects(projects, searchQuery),
		[projects, searchQuery],
	);
	const projectRows = useMemo(
		() => buildProjectDisplayRows(filteredProjects),
		[filteredProjects],
	);

	function updateField(
		field: ProjectFormFieldName,
		event: ChangeEvent<HTMLInputElement>,
	): void {
		setForm((current) => ({ ...current, [field]: event.target.value }));
	}

	function openCreateDialog(): void {
		setForm(EMPTY_PROJECT_FORM_STATE);
		setEditingProjectId(null);
		setFormError(null);
		setDialogMode("create");
	}

	function openEditDialog(project: WorkspaceProjectRecord): void {
		setForm(formStateFromProject(project));
		setEditingProjectId(project.id);
		setFormError(null);
		setDialogMode("edit");
	}

	function closeDialog(): void {
		setDialogMode(null);
		setEditingProjectId(null);
		setFormError(null);
	}

	function updateRepositoryQuery(value: string): void {
		setForm((current) => ({ ...current, repositoryQuery: value }));
	}

	function updateRepositorySelection(
		selection: ProjectRepositorySelection | null,
	): void {
		setForm((current) => ({ ...current, repositorySelection: selection }));
	}

	async function submitProject(
		event: FormEvent<HTMLFormElement>,
	): Promise<void> {
		event.preventDefault();
		setFormError(null);
		if (!workspaceId) {
			setFormError("Workspace is still loading.");
			return;
		}
		try {
			if (dialogMode === "edit" && editingProjectId) {
				await updateProject.mutateAsync({
					projectId: editingProjectId,
					project: buildProjectUpdateRequest(form),
				});
			} else {
				await createProject.mutateAsync(
					buildProjectCreateRequest(form, {
						boardId: "board-1",
						ownerId: workspaceId,
					}),
				);
			}
			setForm(EMPTY_PROJECT_FORM_STATE);
			setEditingProjectId(null);
			setDialogMode(null);
		} catch (error) {
			setFormError(
				error instanceof Error ? error.message : "Project save failed",
			);
		}
	}

	return (
		<section className="grid h-[100dvh] max-h-[100dvh] min-w-0 grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden bg-background text-zinc-100">
			<header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-inset px-5 py-4">
				<div className="flex min-w-0 items-center gap-2">
					<Typography className="truncate" variant="pageTitle">
						Projects
					</Typography>
					<Typography variant="description">{projects.length}</Typography>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						aria-label="Refresh projects"
						onClick={() => void projectsQuery.refetch()}
						size="icon"
						variant="ghost"
						type="button"
					>
						<RefreshCw size={16} />
					</Button>
					<Button
						disabled={!workspaceId || currentWorkspaceQuery.isLoading}
						onClick={openCreateDialog}
						size="sm"
						type="button"
					>
						<Plus size={16} />
						New project
					</Button>
				</div>
			</header>
			<ProjectsToolbar
				density={density}
				filteredCount={filteredProjects.length}
				searchQuery={searchQuery}
				totalCount={projects.length}
				onDensityChange={setDensity}
				onSearchChange={setSearchQuery}
			/>
			<div className="min-h-0 p-5 pt-4">
				<ProjectsTable
					density={density}
					error={projectsQuery.error}
					isLoading={projectsQuery.isLoading}
					rows={projectRows}
					searchQuery={searchQuery}
					totalCount={projects.length}
					onEditProject={openEditDialog}
				/>
			</div>
			{dialogMode ? (
				<ProjectFormDialog
					form={form}
					formError={formError}
					isSaving={createProject.isPending || updateProject.isPending}
					mode={dialogMode}
					onClose={closeDialog}
					onRepositoryQueryChange={updateRepositoryQuery}
					onRepositorySelectionChange={updateRepositorySelection}
					onSubmit={(event) => void submitProject(event)}
					onUpdateField={updateField}
				/>
			) : null}
		</section>
	);
}
