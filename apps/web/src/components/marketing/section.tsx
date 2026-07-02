"use client";

import * as React from "react";
import { motion, MotionConfig, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Motion helpers for marketing pages. All animations respect the user's
 * `prefers-reduced-motion` setting via <MotionConfig reducedMotion="user">.
 */

export function MarketingMotionProvider({
  children
}: {
  children: React.ReactNode;
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

interface FadeInProps extends React.ComponentPropsWithoutRef<typeof motion.div> {
  delay?: number;
  /** Slide offset in px; direction follows the sign. */
  y?: number;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  y = 24,
  ...props
}: FadeInProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  staggerChildren = 0.08
}: {
  children: React.ReactNode;
  className?: string;
  staggerChildren?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Standard marketing section shell with optional eyebrow/heading. */
export function Section({
  id,
  eyebrow,
  heading,
  subheading,
  children,
  className,
  dark = false
}: {
  id?: string;
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "px-6 py-20 sm:py-28",
        dark && "bg-hero-gradient text-navy-50",
        className
      )}
    >
      <div className="mx-auto w-full max-w-6xl">
        {(eyebrow || heading || subheading) && (
          <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
            {eyebrow ? (
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                {eyebrow}
              </p>
            ) : null}
            {heading ? (
              <h2
                className={cn(
                  "font-display text-3xl font-semibold tracking-tight sm:text-4xl",
                  dark ? "text-white" : "text-foreground"
                )}
              >
                {heading}
              </h2>
            ) : null}
            {subheading ? (
              <p
                className={cn(
                  "mt-4 text-base leading-relaxed sm:text-lg",
                  dark ? "text-navy-200" : "text-muted-foreground"
                )}
              >
                {subheading}
              </p>
            ) : null}
          </FadeIn>
        )}
        {children}
      </div>
    </section>
  );
}
