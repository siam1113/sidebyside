import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Side by Side",
  description: "Compare LLM gateways and models, benchmark them, and sandbox CLI tools against them -- all side by side.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col overflow-hidden text-neutral-100">
        <SiteHeader />
        <main className="min-h-0 flex-1 overflow-hidden">
          <div
            id="app-scroll"
            className="mx-auto h-full w-full max-w-[80rem] overflow-y-auto px-4 py-10 sm:px-6 sm:py-14"
          >
            {children}
          </div>
        </main>
        <footer className="shrink-0 border-t border-white/5 px-4 py-5 sm:px-6">
          <div className="mx-auto flex max-w-[80rem] items-center gap-2 text-xs text-neutral-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
            Running locally &middot; configs never leave this machine
          </div>
        </footer>
      </body>
    </html>
  );
}
