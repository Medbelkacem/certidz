"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  FileSignature,
  Fingerprint,
  ShieldCheck,
  Sparkles
} from "lucide-react";

import { Button } from "@certidz/ui";

import { en } from "@/lib/i18n/en";

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

/**
 * Landing hero. Client component so the headline can stage in and the
 * "signature verified" glass card can float — both gated on
 * `prefers-reduced-motion` via `useReducedMotion`.
 */
export function Hero() {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } }
  };
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: EASE }
    }
  };

  return (
    <section className="relative overflow-hidden bg-hero-gradient text-navy-50">
      {/* Ambient grid + glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.15] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.16) 1px, transparent 1px)",
          backgroundSize: "56px 56px"
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-24 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:py-32">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="max-w-xl"
        >
          <motion.div variants={item}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {en.hero.eyebrow}
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="font-display mt-6 text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            {en.hero.title}
          </motion.h1>

          <motion.p
            variants={item}
            dir="auto"
            className="mt-3 text-lg font-medium text-navy-200"
          >
            <span lang="ar">{en.hero.titleHintAr}</span>
            <span aria-hidden="true" className="mx-2 text-navy-400">
              ·
            </span>
            <span lang="fr">{en.hero.titleHintFr}</span>
          </motion.p>

          <motion.p
            variants={item}
            className="mt-6 max-w-lg text-base leading-relaxed text-navy-200 sm:text-lg"
          >
            {en.hero.subtitle}
          </motion.p>

          <motion.div
            variants={item}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg" variant="gold" className="shadow-glow-gold">
              <Link href="/register">
                <Sparkles aria-hidden="true" />
                {en.hero.ctaPrimary}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/5 text-white backdrop-blur hover:bg-white/10 hover:text-white"
            >
              <Link href="/contact">{en.hero.ctaSecondary}</Link>
            </Button>
          </motion.div>

          <motion.p variants={item} className="mt-6 text-xs text-navy-300">
            Free for individuals · No credit card required · Cancel anytime
          </motion.p>
        </motion.div>

        {/* Floating verified card mock */}
        <div className="relative mx-auto w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 40, rotate: reduce ? 0 : -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -10, 0] }}
              transition={
                reduce
                  ? undefined
                  : { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }
              className="glass glass-edge rounded-2xl p-6 shadow-glass"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                    <FileSignature className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Convention cadre 2026.pdf
                    </p>
                    <p className="text-xs text-navy-300">Sealed · SHA-256</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  Verified
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm text-navy-100">
                    <Fingerprint
                      className="size-4 text-emerald-300"
                      aria-hidden="true"
                    />
                    Identity — Rachid Hamidou
                  </span>
                  <span className="text-xs font-medium text-emerald-300">
                    99% match
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm text-navy-100">
                    <ShieldCheck
                      className="size-4 text-gold-400"
                      aria-hidden="true"
                    />
                    Qualified certificate
                  </span>
                  <span className="text-xs font-medium text-navy-200">
                    Valid until 2027
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
                <span className="font-display text-xl italic text-white">
                  R. Hamidou
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
              </div>
            </motion.div>
          </motion.div>

          {/* Small floating seal accent */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.7 }}
            className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-gold-500 p-3 text-navy-950 shadow-glow-gold sm:block"
          >
            <BadgeCheck className="size-7" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
