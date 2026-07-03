import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GetSuperpower",
  description: "Install a complete AI-agent workflow as one callable GetSuperpower skill.",
  metadataBase: new URL("https://github.com/0xroylee/getsuperpower"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
