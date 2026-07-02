"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  Check,
  FileSignature,
  FileText,
  Files,
  IdCard,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldCheck,
  Workflow,
  type LucideIcon
} from "lucide-react";

import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@certidz/ui";

import { cn } from "@/lib/utils";
import { organizations } from "@/lib/mock-data";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Envelopes", href: "/envelopes", icon: FileSignature },
  { label: "Templates", href: "/templates", icon: Files },
  { label: "Certificates", href: "/certificates", icon: ShieldCheck },
  { label: "Identity", href: "/identity", icon: IdCard },
  { label: "Workflows", href: "/workflows", icon: Workflow },
  { label: "AI Assistant", href: "/ai", icon: Bot },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Audit Logs", href: "/audit", icon: ScrollText },
  { label: "Organization", href: "/settings?tab=organization", icon: Building2 },
  { label: "Settings", href: "/settings", icon: Settings }
];

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** Called when a nav link is chosen — lets the mobile drawer close itself. */
  onNavigate?: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [activeOrg, setActiveOrg] = React.useState(organizations[0]);

  return (
    <div className="flex h-full flex-col bg-navy-950 text-navy-100">
      {/* Org switcher */}
      <div className="flex h-16 items-center gap-2 border-b border-white/5 px-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
              collapsed && "justify-center px-0"
            )}
            aria-label="Switch organization"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-navy-600 text-sm font-bold text-white shadow-glow-emerald">
              {activeOrg?.name.slice(0, 2).toUpperCase()}
            </span>
            {!collapsed ? (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">
                  {activeOrg?.name}
                </span>
                <span className="block truncate text-xs text-navy-300">
                  {activeOrg?.sector}
                </span>
              </span>
            ) : null}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onSelect={() => setActiveOrg(org)}
                className="gap-2"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                  {org.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{org.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {org.plan}
                  </span>
                </span>
                {org.id === activeOrg?.id ? (
                  <Check className="size-4 text-emerald-500" aria-hidden="true" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Nav */}
      <nav
        aria-label="Primary"
        className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4"
      >
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const base = item.href.split("?")[0] ?? item.href;
            const active =
              pathname === base ||
              (base !== "/dashboard" && pathname.startsWith(`${base}/`));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-white/10 text-white"
                      : "text-navy-200 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-emerald-400"
                    />
                  ) : null}
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: plan badge + collapse toggle */}
      <div className="border-t border-white/5 p-3">
        {!collapsed ? (
          <div className="mb-3 rounded-xl bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-navy-200">Current plan</span>
              <Badge variant="gold">{activeOrg?.plan}</Badge>
            </div>
            <p className="mt-1.5 text-xs text-navy-300">
              Sovereign hosting • Algeria
            </p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-navy-200 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
            collapsed && "justify-center px-0"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="size-5" aria-hidden="true" />
          ) : (
            <>
              <ChevronsLeft className="size-5" aria-hidden="true" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
