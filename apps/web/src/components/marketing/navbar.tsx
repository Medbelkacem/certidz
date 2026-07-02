"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button } from "@certidz/ui";

import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { en } from "@/lib/i18n/en";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#product", label: en.nav.product },
  { href: "/pricing", label: en.nav.pricing },
  { href: "/docs", label: en.nav.docs },
  { href: "/about", label: en.nav.about },
  { href: "/contact", label: en.nav.contact }
] as const;

export function MarketingNavbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "glass border-b border-border/60 py-2" : "bg-transparent py-4"
      )}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6"
      >
        <Logo />

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">{en.common.signIn}</Link>
          </Button>
          <Button asChild>
            <Link href="/register">{en.common.getStarted}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
      </nav>

      {open ? (
        <div id="mobile-nav" className="glass mx-4 mt-2 rounded-2xl p-4 md:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            <Button variant="outline" asChild>
              <Link href="/login">{en.common.signIn}</Link>
            </Button>
            <Button asChild>
              <Link href="/register">{en.common.getStarted}</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
