import type { Metadata } from "next";
import { Google_Sans, Google_Sans_Code } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";
import { siteDescription, siteUrl } from "@/lib/site";

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
  metadataBase: new URL(siteUrl),
  description: siteDescription,
  openGraph: { title: "AI Agent Zoo — One mind, four instincts", description: siteDescription, siteName: "AI Agent Zoo", type: "website", locale: "en_US", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "AI Agent Zoo — four specialist animals in one shared habitat" }] },
  twitter: { card: "summary_large_image", title: "AI Agent Zoo — One mind, four instincts", description: siteDescription, images: ["/opengraph-image"] },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${googleSans.variable} ${googleSansCode.variable}`}>
      <body>{children}</body>
    </html>
  );
}
