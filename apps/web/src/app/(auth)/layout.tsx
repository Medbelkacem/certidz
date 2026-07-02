import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AuthBrandPanel } from "@/components/auth/brand-panel";
import { Logo } from "@/components/marketing/logo";
import { MarketingMotionProvider } from "@/components/marketing/section";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Split-screen auth shell: form column on the left (scrollable, centered),
 * brand gradient panel with a rotating trust quote on the right. No marketing
 * navigation — just the logo, a theme toggle and a link back home.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <MarketingMotionProvider>
      <div className="grid min-h-dvh lg:grid-cols-2">
        <div className="flex flex-col px-6 py-8 sm:px-10">
          <header className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Back to home</span>
              </Link>
            </div>
          </header>

          <main className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-sm">{children}</div>
          </main>
        </div>

        <AuthBrandPanel />
      </div>
    </MarketingMotionProvider>
  );
}
