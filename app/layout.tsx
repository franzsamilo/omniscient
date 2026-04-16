import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/chrome/Sidebar";
import { Topbar } from "@/components/chrome/Topbar";
import { ConsoleTicker } from "@/components/chrome/ConsoleTicker";
import { LiveBoot } from "@/components/chrome/LiveBoot";
import { ShortcutBoot } from "@/components/chrome/ShortcutBoot";
import { CommandPalette } from "@/components/chrome/CommandPalette";
import { ShortcutCheat } from "@/components/chrome/ShortcutCheat";
import { PresenterIndicator } from "@/components/chrome/PresenterIndicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "OMNISCIENT · Smart Campus Energy Management System",
    template: "OMNISCIENT · %s",
  },
  description:
    "Unified command center for campus energy. Live telemetry, automated controls, AI recommendations, seismic safety. Nothing goes unmeasured.",
  applicationName: "OMNISCIENT",
  manifest: "/manifest.json",
  openGraph: {
    title: "OMNISCIENT — Smart Campus Energy Management System",
    description: "Nothing goes unmeasured.",
    siteName: "OMNISCIENT",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c11",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="omni-noise min-h-full bg-[var(--color-bg)] text-[var(--color-fg)]">
        <LiveBoot />
        <ShortcutBoot />
        <div className="omni-bg flex h-screen flex-col overflow-hidden">
          <Topbar />
          <div className="flex min-h-0 flex-1">
            <Sidebar />
            <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              {children}
            </main>
          </div>
          <ConsoleTicker />
        </div>
        <CommandPalette />
        <ShortcutCheat />
        <PresenterIndicator />
      </body>
    </html>
  );
}
