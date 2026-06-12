import { extractMarkerJsonArray } from "../planning/planner-json";
import type { ImplementationSubAgentTask } from "../types/implementation-subagent.types";

const MARKER_NAME = "IMPLEMENTATION_SUBAGENTS_JSON";

export function parseImplementationSubAgentTasks(
	planSummary: string | undefined,
): ImplementationSubAgentTask[] {
	const jsonText = extractMarkerJsonArray(planSummary ?? "", MARKER_NAME);
	if (!jsonText) {
		return [];
	}
	const parsed = JSON.parse(jsonText) as unknown;
	if (!Array.isArray(parsed)) {
		throw new Error(`${MARKER_NAME} must be a JSON array.`);
	}
	return parsed
		.map((value, index) => validateImplementationSubAgentTask(value, index))
		.filter((task) => task.title.length > 0);
}

function validateImplementationSubAgentTask(
	value: unknown,
	index: number,
): ImplementationSubAgentTask {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${MARKER_NAME} item ${index} must be an object.`);
	}
	const record = value as Record<string, unknown>;
	const title = parseRequiredString(record.title, "title", index);
	const id = parseOptionalString(record.id) ?? `task-${index + 1}`;
	const description = parseOptionalString(record.description);
	const verification = parseOptionalString(record.verification);
	const ownedPaths = parseOwnedPaths(record.ownedPaths, index);
	return {
		id: normalizeTaskId(id),
		title,
		...(description ? { description } : {}),
		...(ownedPaths ? { ownedPaths } : {}),
		...(verification ? { verification } : {}),
	};
}

function parseRequiredString(
	value: unknown,
	field: string,
	index: number,
): string {
	const parsed = parseOptionalString(value);
	if (!parsed) {
		throw new Error(`${MARKER_NAME} item ${index} is missing ${field}.`);
	}
	return parsed;
}

function parseOptionalString(value: unknown): string | undefined {
	return typeof value === "string" ? value.trim() || undefined : undefined;
}

function parseOwnedPaths(value: unknown, index: number): string[] | undefined {
	if (value === undefined) {
		return undefined;
	}
	if (!Array.isArray(value)) {
		throw new Error(
			`${MARKER_NAME} item ${index} ownedPaths must be an array.`,
		);
	}
	const paths = value
		.map((item, pathIndex) => {
			if (typeof item !== "string") {
				throw new Error(
					`${MARKER_NAME} item ${index} ownedPaths ${pathIndex} must be a string.`,
				);
			}
			return item.trim();
		})
		.filter(Boolean);
	return paths.length > 0 ? paths : undefined;
}

function normalizeTaskId(input: string): string {
	const normalized = input
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return normalized || "task";
}
