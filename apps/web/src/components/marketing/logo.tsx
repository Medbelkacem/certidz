import Link from "next/link";

import { cn } from "@/lib/utils";

/** CertiDZ shield mark — pure SVG, inherits currentColor for the wordmark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <path
        d="M16 2 27 6.5v8.2c0 6.9-4.7 12.3-11 15.3C9.7 27 5 21.6 5 14.7V6.5L16 2Z"
        className="fill-navy-900 dark:fill-navy-800"
      />
      <path
        d="M16 2 27 6.5v8.2c0 6.9-4.7 12.3-11 15.3V2Z"
        className="fill-navy-800 dark:fill-navy-700"
      />
      <path
        d="m11.2 15.8 3.1 3.2 6.5-7"
        stroke="url(#certidz-check)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="certidz-check" x1="11" y1="19" x2="21" y2="12">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({
  href = "/",
  withByline = true,
  className
}: {
  href?: string;
  withByline?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="CertiDZ — home"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <LogoMark />
      <span className="flex items-baseline gap-1.5">
        <span className="text-lg font-bold tracking-tight text-foreground">
          Certi<span className="text-emerald-600 dark:text-emerald-400">DZ</span>
        </span>
        {withByline ? (
          <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            by HISN
          </span>
        ) : null}
      </span>
    </Link>
  );
}
