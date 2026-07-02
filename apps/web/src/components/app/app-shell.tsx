"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-white/5 transition-[width] duration-300 lg:block",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-72 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <Sidebar
              collapsed={false}
              onToggleCollapse={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[padding] duration-300",
          collapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
