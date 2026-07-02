import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        warning:
          "border-transparent bg-gold-500/15 text-gold-700 dark:text-gold-300",
        destructive:
          "border-transparent bg-destructive/15 text-destructive dark:text-red-300",
        info: "border-transparent bg-navy-500/15 text-navy-700 dark:text-navy-200",
        gold: "border-gold-500/40 bg-gold-500/10 text-gold-700 dark:text-gold-300"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
