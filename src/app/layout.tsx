import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireX — AI Resume Screener",
  description: "Bulk AI-powered resume screening for Launchpad cohorts",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
