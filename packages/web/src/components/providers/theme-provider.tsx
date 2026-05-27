"use client";

import {
	ThemeProvider as NextThemesProvider,
	type ThemeProviderProps,
} from "next-themes";
import type { ReactElement } from "react";

type Props = ThemeProviderProps;

export function ThemeProvider({ children, ...props }: Props): ReactElement {
	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme="light"
			disableTransitionOnChange
			enableSystem={false}
			themes={["light", "dark"]}
			{...props}
		>
			{children}
		</NextThemesProvider>
	);
}
