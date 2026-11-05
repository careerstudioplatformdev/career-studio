import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Career Studio",
  description: "Build an honest, ATS-friendly resume and get ready for your next job.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:h-14 sm:flex-nowrap sm:py-0">
            <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold text-ink">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-sm font-bold text-white">CS</span>
              Career Studio
            </Link>
            <div className="-mx-2 w-full sm:mx-0 sm:w-auto">
              <SiteNav />
            </div>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="mt-16 border-t border-line py-6 text-center text-xs text-muted">
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <span className="mx-2">·</span>
          Career Studio never invents facts on your resume.
        </footer>
      </body>
    </html>
  );
}
