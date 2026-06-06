"use client";

import type { ReactElement } from "react";

import { Typography } from "@/components/ui/typography";

import { Field } from "./project-form-field";
import type {
	ProjectFormFieldName,
	ProjectFormState,
} from "./types/projects-panel.types";

export function ProjectHookFields({
	form,
	onUpdateField,
}: {
	form: ProjectFormState;
	onUpdateField: (field: ProjectFormFieldName, value: string) => void;
}): ReactElement {
	return (
		<fieldset className="grid gap-3 border-0 border-t border-border p-0 pt-4">
			<Typography as="legend" className="mb-1" variant="label">
				Hooks
			</Typography>
			<div className="grid gap-3 sm:grid-cols-2">
				<Field htmlFor="project-pre-hook-script" label="Before workflow">
					<textarea
						className="min-h-32 rounded-md border border-input bg-surface-input px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition placeholder:text-muted-foreground/80 focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-ring"
						id="project-pre-hook-script"
						onChange={(event) =>
							onUpdateField("preHookScript", event.target.value)
						}
						placeholder="bun install --frozen-lockfile"
						spellCheck={false}
						value={form.preHookScript}
					/>
				</Field>
				<Field htmlFor="project-after-hook-script" label="After workflow">
					<textarea
						className="min-h-32 rounded-md border border-input bg-surface-input px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition placeholder:text-muted-foreground/80 focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-ring"
						id="project-after-hook-script"
						onChange={(event) =>
							onUpdateField("afterHookScript", event.target.value)
						}
						placeholder="echo done"
						spellCheck={false}
						value={form.afterHookScript}
					/>
				</Field>
			</div>
		</fieldset>
	);
}
