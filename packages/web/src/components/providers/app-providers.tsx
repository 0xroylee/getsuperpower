"use client";

import type { ReactElement, ReactNode } from "react";
import { Toaster } from "sonner";

import { AppQueryClientProvider } from "@/components/providers/query-client-provider";
import { RealtimeEventsProvider } from "@/components/providers/realtime-events-provider";

type Props = {
	children: ReactNode;
};

export function AppProviders({ children }: Props): ReactElement {
	return (
		<AppQueryClientProvider>
			<RealtimeEventsProvider>{children}</RealtimeEventsProvider>
			<Toaster
				closeButton
				position="bottom-right"
				richColors
				theme="dark"
				toastOptions={{
					style: {
						boxShadow: "none",
					},
				}}
			/>
		</AppQueryClientProvider>
	);
}
