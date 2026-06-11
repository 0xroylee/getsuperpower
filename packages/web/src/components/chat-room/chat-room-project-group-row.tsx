"use client";

import {
	ChevronDown,
	ChevronRight,
	Folder,
	MoreHorizontal,
	Pin,
	PinOff,
} from "lucide-react";
import { type ReactElement, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type { ChatRoomProjectGroupRowProps } from "./types/chat-room-sidebar.types";

export function ChatRoomProjectGroupRow({
	firstSessionId,
	group,
	isExpanded,
	onPinProject,
	onToggleProjectGroup,
	onUnpinProject,
}: ChatRoomProjectGroupRowProps): ReactElement {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const GroupIcon = isExpanded ? ChevronDown : ChevronRight;
	const pinLabel = group.isPinned ? "Unpin project" : "Pin project";

	useEffect(() => {
		if (!isMenuOpen) return;
		function closeOnOutsidePointer(event: PointerEvent): void {
			const target = event.target;
			if (target instanceof Node && menuRef.current?.contains(target)) return;
			setIsMenuOpen(false);
		}
		function closeOnEscape(event: KeyboardEvent): void {
			if (event.key === "Escape") setIsMenuOpen(false);
		}
		document.addEventListener("pointerdown", closeOnOutsidePointer);
		document.addEventListener("keydown", closeOnEscape);
		return () => {
			document.removeEventListener("pointerdown", closeOnOutsidePointer);
			document.removeEventListener("keydown", closeOnEscape);
		};
	}, [isMenuOpen]);

	function togglePinned(): void {
		if (group.isPinned) {
			onUnpinProject(group.id);
		} else {
			onPinProject(group.id);
		}
		setIsMenuOpen(false);
	}

	return (
		<div
			className={cn(
				"group/project grid min-w-0 grid-cols-[minmax(0,1fr)_2rem] rounded-md",
				group.isActive ? "bg-[#111110] text-zinc-100" : "text-zinc-400",
			)}
		>
			<Button
				aria-expanded={isExpanded}
				className={cn(
					"h-9 min-w-0 justify-start gap-2 px-2 text-left text-sm",
					group.isActive
						? "hover:bg-[#111110] hover:text-zinc-100"
						: "hover:bg-surface-active hover:text-zinc-200",
				)}
				onClick={() =>
					onToggleProjectGroup(group.id, isExpanded, firstSessionId)
				}
				size="sm"
				title={group.label}
				type="button"
				variant="ghost"
			>
				<GroupIcon className="shrink-0" size={14} />
				<Folder className="shrink-0" size={14} />
				<Typography as="span" className="min-w-0 flex-1 truncate">
					{group.label}
				</Typography>
				{group.isPinned ? (
					<Pin className="shrink-0 text-zinc-300" size={13} />
				) : null}
				<Typography
					className="shrink-0 rounded bg-surface-active px-1.5 py-0.5 text-[11px] leading-none"
					variant="muted"
				>
					{group.sessions.length}
				</Typography>
			</Button>
			{group.isProject ? (
				<div className="relative" ref={menuRef}>
					<Button
						aria-expanded={isMenuOpen}
						aria-haspopup="menu"
						aria-label={`${pinLabel} ${group.label}`}
						className="opacity-0 transition-opacity hover:bg-surface-active group-hover/project:opacity-100 group-focus-within/project:opacity-100"
						onClick={() => setIsMenuOpen((current) => !current)}
						size="icon"
						title="Project actions"
						type="button"
						variant="ghost"
					>
						<MoreHorizontal size={14} />
					</Button>
					{isMenuOpen ? (
						<div
							aria-label={`${group.label} project actions`}
							className="absolute right-0 top-full z-30 mt-1 grid w-36 rounded-md border border-border bg-card p-1"
							role="menu"
						>
							<Button
								className="h-8 justify-start gap-2 px-2 text-sm text-zinc-300 hover:bg-surface-active"
								onClick={togglePinned}
								role="menuitem"
								size="sm"
								type="button"
								variant="ghost"
							>
								{group.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
								<Typography as="span">{pinLabel}</Typography>
							</Button>
						</div>
					) : null}
				</div>
			) : null}
		</div>
	);
}
