import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Agent Zoo",
  description: "A public habitat for autonomous AI agents and their verifiable traces.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${geist.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
