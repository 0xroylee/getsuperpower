"use client";

import { Plus, Save, X } from "lucide-react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";

import { PROJECT_FORM_FIELD_GROUPS } from "./project-form-utils";
import { ProjectRepositoryPicker } from "./project-repository-picker";
import type {
	ProjectDialogMode,
	ProjectFormFieldName,
	ProjectFormState,
	ProjectRepositorySelection,
} from "./types/projects-panel.types";

interface ProjectFormDialogProps {
	form: ProjectFormState;
	formError: string | null;
	isSaving: boolean;
	mode: ProjectDialogMode;
	onClose: () => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	onUpdateField: (
		field: ProjectFormFieldName,
		event: ChangeEvent<HTMLInputElement>,
	) => void;
	onRepositoryQueryChange: (value: string) => void;
	onRepositorySelectionChange: (
		selection: ProjectRepositorySelection | null,
	) => void;
}

export function ProjectFormDialog({
	form,
	formError,
	isSaving,
	mode,
	onClose,
	onSubmit,
	onUpdateField,
	onRepositoryQueryChange,
	onRepositorySelectionChange,
}: ProjectFormDialogProps): ReactElement {
	const title = mode === "create" ? "New project" : "Edit project";
	const submitLabel = mode === "create" ? "Create project" : "Save changes";
	const SubmitIcon = mode === "create" ? Plus : Save;

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className="grid max-h-[min(46rem,calc(100dvh-2rem))] max-w-2xl grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden bg-surface-panel p-0"
				showCloseButton={false}
			>
				<DialogHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b border-border px-4 py-3 text-left">
					<div className="min-w-0">
						<DialogTitle className="truncate text-base">{title}</DialogTitle>
					</div>
					<Button
						aria-label="Close"
						className="shrink-0"
						onClick={onClose}
						size="icon"
						type="button"
						variant="ghost"
					>
						<X size={16} />
					</Button>
				</DialogHeader>
				<form
					className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden"
					onSubmit={onSubmit}
				>
					<div className="grid content-start gap-4 overflow-auto p-4">
						{PROJECT_FORM_FIELD_GROUPS.map((group) => (
							<fieldset
								className="grid gap-3 border-0 border-t border-border p-0 pt-4 first:border-t-0 first:pt-0"
								key={group.title}
							>
								<Typography as="legend" className="mb-1" variant="label">
									{group.title}
								</Typography>
								<div className="grid gap-3 sm:grid-cols-2">
									{group.title === "Repository" ? (
										<ProjectRepositoryPicker
											query={form.repositoryQuery}
											selection={form.repositorySelection}
											onQueryChange={onRepositoryQueryChange}
											onSelectionChange={onRepositorySelectionChange}
										/>
									) : null}
									{group.fields
										.filter((field) => field.name !== "repositoryQuery")
										.map((field) => (
											<Typography
												as="label"
												className="grid gap-1"
												htmlFor={`project-form-${field.name}`}
												key={field.name}
												variant="label"
											>
												<Typography
													as="span"
													className="text-zinc-400"
													variant="label"
												>
													{field.label}
												</Typography>
												<Input
													id={`project-form-${field.name}`}
													name={field.name}
													placeholder={field.placeholder}
													type={field.type ?? "text"}
													value={form[field.name]}
													onChange={(event) => onUpdateField(field.name, event)}
												/>
											</Typography>
										))}
								</div>
							</fieldset>
						))}
						{formError ? (
							<Typography
								className="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2"
								variant="error"
							>
								{formError}
							</Typography>
						) : null}
					</div>
					<footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3">
						<Button
							onClick={onClose}
							size="sm"
							type="button"
							variant="secondary"
						>
							Cancel
						</Button>
						<Button disabled={isSaving} size="sm" type="submit">
							<SubmitIcon size={15} />
							{submitLabel}
						</Button>
					</footer>
				</form>
			</DialogContent>
		</Dialog>
	);
}
