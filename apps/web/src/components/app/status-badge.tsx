import { Badge, type BadgeProps } from "@certidz/ui";

import { cn } from "@/lib/utils";

/**
 * Maps every domain status (envelope / document / certificate / identity)
 * onto a semantic Badge variant + human label + dot color, so status is
 * shown consistently across the whole dashboard.
 */
type Variant = NonNullable<BadgeProps["variant"]>;

interface StatusMeta {
  label: string;
  variant: Variant;
  dot: string;
}

const STATUS_MAP: Record<string, StatusMeta> = {
  // Envelopes
  draft: { label: "Draft", variant: "outline", dot: "bg-muted-foreground" },
  sent: { label: "Sent", variant: "info", dot: "bg-navy-400" },
  in_progress: { label: "In progress", variant: "warning", dot: "bg-gold-400" },
  completed: { label: "Completed", variant: "success", dot: "bg-emerald-500" },
  declined: { label: "Declined", variant: "destructive", dot: "bg-destructive" },
  voided: { label: "Voided", variant: "outline", dot: "bg-muted-foreground" },
  expired: { label: "Expired", variant: "destructive", dot: "bg-destructive" },
  // Documents
  pending: { label: "Pending", variant: "warning", dot: "bg-gold-400" },
  signed: { label: "Signed", variant: "success", dot: "bg-emerald-500" },
  archived: { label: "Archived", variant: "secondary", dot: "bg-navy-400" },
  // Certificates
  active: { label: "Active", variant: "success", dot: "bg-emerald-500" },
  expiring: { label: "Expiring", variant: "warning", dot: "bg-gold-400" },
  revoked: { label: "Revoked", variant: "destructive", dot: "bg-destructive" },
  // Identity
  verified: { label: "Verified", variant: "success", dot: "bg-emerald-500" },
  review: { label: "In review", variant: "warning", dot: "bg-gold-400" },
  failed: { label: "Failed", variant: "destructive", dot: "bg-destructive" }
};

const FALLBACK: StatusMeta = {
  label: "Unknown",
  variant: "outline",
  dot: "bg-muted-foreground"
};

export interface StatusBadgeProps {
  status: string;
  className?: string;
  /** Show the leading status dot. Defaults to true. */
  dot?: boolean;
}

export function StatusBadge({ status, className, dot = true }: StatusBadgeProps) {
  const meta = STATUS_MAP[status] ?? FALLBACK;
  return (
    <Badge variant={meta.variant} className={cn("capitalize", className)}>
      {dot ? (
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", meta.dot)}
        />
      ) : null}
      {meta.label}
    </Badge>
  );
}
