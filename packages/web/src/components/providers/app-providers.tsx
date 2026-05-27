"use client";

import { useTheme } from "next-themes";
import type { ReactElement, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import { AppQueryClientProvider } from "@/components/providers/query-client-provider";
import { RealtimeEventsProvider } from "@/components/providers/realtime-events-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

type Props = {
	children: ReactNode;
};

function ThemedToaster(): ReactElement {
	const { resolvedTheme } = useTheme();
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const activeTheme = isMounted && resolvedTheme === "dark" ? "dark" : "light";

	return (
		<Toaster
			closeButton
			position="bottom-right"
			richColors
			theme={activeTheme}
			toastOptions={{
				style: {
					boxShadow: "none",
				},
			}}
		/>
	);
}

export function AppProviders({ children }: Props): ReactElement {
	return (
		<ThemeProvider>
			<AppQueryClientProvider>
				<RealtimeEventsProvider>{children}</RealtimeEventsProvider>
				<ThemedToaster />
			</AppQueryClientProvider>
		</ThemeProvider>
	);
}
