import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "EvalForge", template: "%s · EvalForge" },
  description: "Release gate for LLM changes: frozen cases, a measured judge, and ship/block decisions with reasons.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
