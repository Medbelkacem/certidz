"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, Quote, ShieldCheck } from "lucide-react";

import { LogoMark } from "@/components/marketing/logo";

const QUOTES = [
  {
    text: "CertiDZ cut our contract turnaround from eleven days to four hours — and our auditors finally smile.",
    author: "Head of Legal, Numidia Bank"
  },
  {
    text: "For the first time, our qualified signatures live under Algerian law, on Algerian soil.",
    author: "CIO, Ministry of Digitalisation"
  },
  {
    text: "Onboarding a citizen now takes a selfie and thirty seconds, not a trip to the counter.",
    author: "Product Lead, Saharatech Énergie"
  }
] as const;

const TRUST = ["eIDAS-ready", "Law 15-04", "ISO/IEC 27001", "Hosted in Algeria"] as const;

/**
 * Right-hand brand panel for the auth split-screen. Rotates a trust quote
 * every few seconds; rotation and cross-fade are disabled under
 * `prefers-reduced-motion` (the first quote simply stays put).
 */
export function AuthBrandPanel() {
  const reduce = useReducedMotion();
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % QUOTES.length),
      6000
    );
    return () => window.clearInterval(id);
  }, [reduce]);

  const active = QUOTES[index] ?? QUOTES[0];

  return (
    <aside className="relative hidden overflow-hidden bg-hero-gradient p-10 text-navy-50 lg:flex lg:flex-col lg:justify-between">
      {/* ambient grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.14] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.16) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />

      <div className="relative flex items-center gap-2.5">
        <LogoMark className="size-9" />
        <span className="text-lg font-bold tracking-tight text-white">
          Certi<span className="text-emerald-400">DZ</span>
        </span>
        <span className="text-[11px] font-medium uppercase tracking-widest text-navy-300">
          by HISN
        </span>
      </div>

      <div className="relative max-w-md">
        <Quote className="size-9 text-emerald-400/70" aria-hidden="true" />
        <div className="mt-4 min-h-[8.5rem]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={index}
              initial={reduce ? undefined : { opacity: 0, y: 12 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <p className="font-display text-2xl font-medium leading-snug text-white">
                {active.text}
              </p>
              <footer className="mt-4 text-sm text-navy-200">
                — {active.author}
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        {/* rotation dots */}
        <div className="mt-6 flex gap-2" role="tablist" aria-label="Testimonials">
          {QUOTES.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show testimonial ${i + 1}`}
              onClick={() => setIndex(i)}
              className="h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              style={{
                width: i === index ? "1.75rem" : "0.5rem",
                backgroundColor:
                  i === index ? "rgb(52 211 153)" : "rgba(255,255,255,0.25)"
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="flex flex-wrap gap-2">
          {TRUST.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-navy-100"
            >
              <ShieldCheck className="size-3.5 text-emerald-400" aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 text-xs text-navy-300">
          <BadgeCheck className="size-4 text-gold-400" aria-hidden="true" />
          Trusted by 180+ institutions across Algeria &amp; Africa
        </p>
      </div>
    </aside>
  );
}
