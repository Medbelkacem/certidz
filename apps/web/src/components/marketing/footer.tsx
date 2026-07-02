import Link from "next/link";

import { Logo } from "@/components/marketing/logo";
import { en } from "@/lib/i18n/en";

const FOOTER_COLUMNS = [
  {
    heading: en.footer.product,
    links: [
      { label: "Electronic signatures", href: "/#product" },
      { label: "Identity verification", href: "/#product" },
      { label: "PKI certificates", href: "/#product" },
      { label: "AI assistant", href: "/#product" },
      { label: "Pricing", href: "/pricing" }
    ]
  },
  {
    heading: en.footer.company,
    links: [
      { label: "About HISN", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/about" },
      { label: "Press kit", href: "/about" }
    ]
  },
  {
    heading: en.footer.resources,
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "API reference", href: "/docs" },
      { label: "Status", href: "/docs" },
      { label: "Security", href: "/docs" }
    ]
  },
  {
    heading: en.footer.legal,
    links: [
      { label: "Terms of service", href: "/docs" },
      { label: "Privacy policy", href: "/docs" },
      { label: "Law 15-04 compliance", href: "/docs" },
      { label: "Certification practices", href: "/docs" }
    ]
  }
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {en.common.tagline}
            </p>
            <p className="text-sm text-muted-foreground">{en.footer.madeIn}</p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                {column.heading}
              </h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} HISN Technologies SPA. {en.footer.rights}
          </p>
          <p className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              All systems operational
            </span>
            <span aria-hidden="true">•</span>
            <span>Hosted in Algiers, DZ</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
