export { cn } from "@certidz/ui";

/** Format a number as Algerian dinar, e.g. 4 900 DZD. */
export function formatDZD(amount: number): string {
  return `${new Intl.NumberFormat("fr-DZ").format(amount)} DZD`;
}

/** Compact number formatting for stat cards, e.g. 1.2M. */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

/** Human date, e.g. "12 Jun 2026". */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(iso));
}

/** Relative time, e.g. "3 h ago" / "in 12 days". */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const target = new Date(iso).getTime();
  const diffMs = target - now.getTime();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always", style: "narrow" });

  const minutes = Math.round(diffMs / 60_000);
  if (abs < 3_600_000) return rtf.format(minutes, "minute");
  const hours = Math.round(diffMs / 3_600_000);
  if (abs < 86_400_000) return rtf.format(hours, "hour");
  const days = Math.round(diffMs / 86_400_000);
  if (abs < 30 * 86_400_000) return rtf.format(days, "day");
  const months = Math.round(days / 30);
  return rtf.format(months, "month");
}

/** Whole days until an ISO date (negative if past). */
export function daysUntil(iso: string, now: Date = new Date()): number {
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000);
}

/** Initials for avatar fallbacks: "Amine Benali" → "AB". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Truncate a hash for display: "a3f9…c21b". */
export function shortHash(hash: string, edge = 6): string {
  if (hash.length <= edge * 2 + 1) return hash;
  return `${hash.slice(0, edge)}…${hash.slice(-4)}`;
}
