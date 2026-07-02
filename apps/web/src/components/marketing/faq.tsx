"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Accessible disclosure accordion. Each row is a real <button> that toggles
 * `aria-expanded` and controls its panel by id; panels collapse with a
 * height animation that is skipped under `prefers-reduced-motion`.
 */
export function Faq({ items }: { items: readonly FaqItem[] }) {
  const [open, setOpen] = React.useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto max-w-3xl divide-y divide-border rounded-2xl border border-border bg-card">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `faq-panel-${i}`;
        const buttonId = `faq-button-${i}`;
        return (
          <div key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <span className="text-base font-medium text-foreground">
                  {item.question}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "size-5 shrink-0 text-muted-foreground transition-transform duration-300",
                    isOpen && "rotate-180 text-emerald-600 dark:text-emerald-400"
                  )}
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={reduce ? undefined : { height: 0, opacity: 0 }}
                  animate={reduce ? undefined : { height: "auto", opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
