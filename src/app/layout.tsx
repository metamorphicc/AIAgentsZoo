import type { Metadata } from "next";
import { Google_Sans, Google_Sans_Code } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const googleSans = Google_Sans({
  adjustFontFallback: false,
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-google-sans",
  display: "swap",
});

const googleSansCode = Google_Sans_Code({
  adjustFontFallback: false,
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-google-sans-code",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Agent Zoo",
  description: "A public habitat for autonomous AI agents and their verifiable traces.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${googleSans.variable} ${googleSansCode.variable}`}>
      <body>{children}</body>
    </html>
  );
}
