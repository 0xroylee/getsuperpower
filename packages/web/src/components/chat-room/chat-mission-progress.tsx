"use client";

import {
	CheckCircle2,
	CircleAlert,
	Loader2,
	Radio,
	ScrollText,
} from "lucide-react";
import type { ReactElement } from "react";

import { cn } from "@/lib/utils";

import type {
	ChatMissionExecution,
	ChatMissionProgressViewModel,
	ChatMissionResult,
} from "./types/chat-mission-progress.types";

export function ChatMissionProgress({
	mission,
}: {
	mission: ChatMissionProgressViewModel | null;
}): ReactElement | null {
	if (!mission) return null;
	const isLoading = mission.state === "loading";
	const isError = mission.state === "error";
	return (
		<section
			className="grid gap-4 justify-self-stretch rounded-md border border-zinc-800 bg-[#141519] px-3 py-3 text-sm text-zinc-300"
			data-chat-mission-progress="true"
		>
			<header className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<div className="flex items-center gap-2 text-xs font-medium uppercase text-zinc-500">
						<Radio size={14} />
						<span>Mission</span>
					</div>
					<h2 className="m-0 mt-1 truncate text-base font-semibold text-zinc-100">
						{mission.title || "Session mission"}
					</h2>
					{mission.taskKey ? (
						<p className="m-0 mt-1 text-xs text-zinc-500">{mission.taskKey}</p>
					) : null}
				</div>
				<MissionStatus mission={mission} />
			</header>
			{isLoading ? <MissionState label="Loading mission progress..." /> : null}
			{isError ? (
				<MissionState
					label={mission.errorMessage ?? "Mission progress unavailable."}
				/>
			) : null}
			{mission.state === "ready" ? <MissionBody mission={mission} /> : null}
		</section>
	);
}

function MissionBody({
	mission,
}: {
	mission: ChatMissionProgressViewModel;
}): ReactElement {
	return (
		<div className="grid gap-4">
			{mission.notes.length > 0 ? (
				<section className="grid gap-2">
					<SectionTitle
						icon={<ScrollText size={14} />}
						title="Plan & updates"
					/>
					<div className="grid gap-3">
						{mission.notes.map((note) => (
							<article className="grid gap-1" key={note.id}>
								<p className="m-0 text-xs text-zinc-500">
									{note.actorId} · {note.title}
								</p>
								<p className="m-0 whitespace-pre-wrap leading-6 text-zinc-300">
									{note.body}
								</p>
							</article>
						))}
					</div>
				</section>
			) : null}
			{mission.executions.length > 0 ? (
				<section className="grid gap-2">
					<SectionTitle icon={<Radio size={14} />} title="Progress logs" />
					<div className="grid gap-3">
						{mission.executions.map((execution) => (
							<MissionExecution execution={execution} key={execution.id} />
						))}
					</div>
				</section>
			) : null}
			{mission.latestResult ? (
				<div className="flex items-center gap-2 border-t border-zinc-800 pt-3">
					<ResultIcon tone={mission.latestResult.tone} />
					<p className="m-0 text-sm text-zinc-300">
						Result:{" "}
						<span className="font-medium text-zinc-100">
							{mission.latestResult.label}
						</span>
					</p>
				</div>
			) : null}
		</div>
	);
}

function MissionExecution({
	execution,
}: {
	execution: ChatMissionExecution;
}): ReactElement {
	return (
		<article className="grid gap-2 border-t border-zinc-800 pt-3 first:border-t-0 first:pt-0">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="m-0 text-xs font-medium uppercase text-zinc-500">
					{execution.title}
				</p>
				{execution.status ? (
					<span className="text-xs text-zinc-500">{execution.status}</span>
				) : null}
			</div>
			{execution.steps.length > 0 ? (
				<div className="grid gap-1">
					{execution.steps.map((step) => (
						<div
							className="grid gap-1 rounded-sm bg-[#101115] px-2 py-1.5"
							key={step.id}
						>
							<div className="flex flex-wrap justify-between gap-2">
								<span className="font-medium text-zinc-200">{step.action}</span>
								<span className="text-xs text-zinc-500">{step.status}</span>
							</div>
							{formatStepDetail(step.detail) ? (
								<p className="m-0 text-xs leading-5 text-zinc-500">
									{formatStepDetail(step.detail)}
								</p>
							) : null}
						</div>
					))}
				</div>
			) : null}
			{execution.logLines.length > 0 ? (
				<div className="grid max-h-64 gap-1 overflow-auto rounded-sm bg-[#101115] px-2 py-2 font-mono text-xs text-zinc-300">
					{execution.logLines.map((line) => (
						<p
							className={cn(
								"m-0 whitespace-pre-wrap break-words",
								line.stream === "stderr" && "text-red-200",
								line.stream === "system" && "text-zinc-500",
							)}
							key={line.id}
						>
							{line.text}
						</p>
					))}
				</div>
			) : null}
		</article>
	);
}

function MissionStatus({
	mission,
}: {
	mission: ChatMissionProgressViewModel;
}): ReactElement {
	return (
		<span className="rounded-sm border border-zinc-700 bg-[#101115] px-2 py-1 text-xs font-medium text-zinc-300">
			{mission.statusLabel}
		</span>
	);
}

function SectionTitle({
	icon,
	title,
}: {
	icon: ReactElement;
	title: string;
}): ReactElement {
	return (
		<h3 className="m-0 flex items-center gap-2 text-xs font-medium uppercase text-zinc-500">
			{icon}
			<span>{title}</span>
		</h3>
	);
}

function MissionState({ label }: { label: string }): ReactElement {
	return <p className="m-0 text-sm text-zinc-500">{label}</p>;
}

function ResultIcon({
	tone,
}: {
	tone: ChatMissionResult["tone"];
}): ReactElement {
	if (tone === "running") {
		return <Loader2 className="animate-spin text-zinc-400" size={15} />;
	}
	if (tone === "error") {
		return <CircleAlert className="text-red-300" size={15} />;
	}
	return <CheckCircle2 className="text-emerald-300" size={15} />;
}

function formatStepDetail(detail: string | null): string {
	if (!detail) return "";
	try {
		const parsed = JSON.parse(detail) as Record<string, unknown>;
		for (const key of ["message", "detail", "error"]) {
			const value = parsed[key];
			if (typeof value === "string" && value.trim()) return value;
		}
	} catch {
		return detail;
	}
	return "";
}
