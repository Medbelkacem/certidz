import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names with conflict resolution.
 * `cn("p-2", condition && "p-4")` → `"p-4"` when condition is truthy.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
