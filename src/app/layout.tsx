import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { BrandMark } from "@/components/ui";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const interTight = Inter_Tight({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-inter-tight" });

export const metadata: Metadata = {
  title: "Career Studio",
  description: "Build an honest, ATS-friendly resume and get ready for your next job.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`}>
      <body className="min-h-screen antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        <header className="border-b border-[#f0f0f2] bg-white">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-6 py-2 sm:min-h-[72px] sm:flex-nowrap sm:py-0">
            <Link href="/" aria-label="Career Studio home" className="flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap text-ink">
              <BrandMark />
              <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-[-0.01em]">Career Studio</span>
            </Link>
            <div className="-mx-2 w-full sm:mx-0 sm:w-auto">
              <SiteNav />
            </div>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="mt-20 border-t border-[#f0f0f2]">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-7 text-sm text-muted">
            <span className="flex items-center gap-2.5">
              <BrandMark size="footer" />
              Career Studio never invents facts on your resume.
            </span>
            <nav aria-label="Footer" className="flex flex-wrap gap-6">
              <Link href="/privacy" className="hover:text-ink">Privacy</Link>
              <Link href="/roadmap" className="hover:text-ink">Roadmap</Link>
              <Link href="/whats-new" className="hover:text-ink">What&apos;s new</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
