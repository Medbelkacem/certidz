"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  LogOut,
  Menu,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  User as UserIcon
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@certidz/ui";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn, formatRelative, initials } from "@/lib/utils";
import { currentUser } from "@/lib/mock-data";
import { notifications } from "@/lib/app-mock-data";

export interface TopbarProps {
  /** Opens the sidebar drawer on mobile. */
  onOpenMobileNav: () => void;
}

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation"
        onClick={onOpenMobileNav}
      >
        <Menu aria-hidden="true" />
      </Button>

      {/* Search */}
      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          role="searchbox"
          aria-label="Search documents, envelopes, people"
          placeholder="Search documents, envelopes, people…"
          className="h-10 w-full rounded-lg border border-input bg-background/60 pl-9 pr-16 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
        <kbd
          aria-hidden="true"
          className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted-foreground md:inline-flex"
        >
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          aria-label="Search"
        >
          <Search aria-hidden="true" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Notifications, ${unread} unread`}
            >
              <Bell aria-hidden="true" />
              {unread > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground"
                >
                  {unread}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between normal-case">
              <span className="text-sm font-semibold text-foreground">
                Notifications
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {unread} unread
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex flex-col items-start gap-0.5 py-2.5"
              >
                <div className="flex w-full items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      n.unread ? "bg-emerald-500" : "bg-transparent"
                    )}
                  />
                  <span className="flex-1 truncate text-sm font-medium text-foreground">
                    {n.title}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatRelative(n.at)}
                  </span>
                </div>
                <span className="pl-3.5 text-xs text-muted-foreground">{n.body}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/audit" className="justify-center text-sm font-medium">
                View all activity
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Account menu"
            >
              <Avatar className="size-9">
                <AvatarFallback className={cn("text-white", currentUser.avatarColor)}>
                  {initials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="flex items-center gap-3 p-2">
              <Avatar className="size-10">
                <AvatarFallback className={cn("text-white", currentUser.avatarColor)}>
                  {initials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {currentUser.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {currentUser.email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <UserIcon aria-hidden="true" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <SettingsIcon aria-hidden="true" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <ShieldCheck aria-hidden="true" /> Security
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/" className="text-destructive focus:text-destructive">
                <LogOut aria-hidden="true" /> Sign out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
