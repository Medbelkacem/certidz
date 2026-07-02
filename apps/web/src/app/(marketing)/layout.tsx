import type { ReactNode } from "react";

import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingMotionProvider } from "@/components/marketing/section";

/**
 * Shell for every public marketing page: sticky glass navbar on top, footer
 * at the bottom, and a motion provider that makes all Framer Motion inside
 * respect `prefers-reduced-motion` automatically.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <MarketingMotionProvider>
      <div className="flex min-h-dvh flex-col">
        <MarketingNavbar />
        {/* pt offsets the fixed navbar height */}
        <main id="main" className="flex-1 pt-16">
          {children}
        </main>
        <MarketingFooter />
      </div>
    </MarketingMotionProvider>
  );
}
