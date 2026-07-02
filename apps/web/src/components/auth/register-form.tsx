"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";

import { Button, Input, Label, toast } from "@certidz/ui";

import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { PasswordInput } from "@/components/auth/password-input";
import { en } from "@/lib/i18n/en";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Strength {
  score: number; // 0–4
  label: string;
  checks: { label: string; met: boolean }[];
}

/** Deterministic client-side password strength scoring. */
function scorePassword(pw: string): Strength {
  const checks = [
    { label: "At least 8 characters", met: pw.length >= 8 },
    { label: "Upper & lowercase letters", met: /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
    { label: "A number", met: /\d/.test(pw) },
    { label: "A symbol", met: /[^A-Za-z0-9]/.test(pw) }
  ];
  const met = checks.filter((c) => c.met).length;
  const score = pw.length === 0 ? 0 : pw.length >= 12 && met === 4 ? 4 : met;
  const label =
    ["Too weak", "Weak", "Fair", "Good", "Strong"][score] ?? "Too weak";
  return { score, label, checks };
}

const BAR_COLOR = [
  "bg-border",
  "bg-destructive",
  "bg-gold-500",
  "bg-emerald-500",
  "bg-emerald-600"
] as const;

const TEXT_COLOR = [
  "text-muted-foreground",
  "text-destructive",
  "text-gold-600 dark:text-gold-400",
  "text-emerald-600 dark:text-emerald-400",
  "text-emerald-600 dark:text-emerald-400"
] as const;

export function RegisterForm() {
  const [values, setValues] = React.useState({
    name: "",
    email: "",
    organization: "",
    password: ""
  });
  const [agreed, setAgreed] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const strength = React.useMemo(
    () => scorePassword(values.password),
    [values.password]
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (values.name.trim().length < 2) next.name = "Please enter your full name.";
    if (!EMAIL_RE.test(values.email)) next.email = "Enter a valid email address.";
    if (values.organization.trim().length < 2)
      next.organization = "Please enter your organization name.";
    if (strength.score < 2) next.password = "Choose a stronger password.";
    if (!agreed) next.terms = "You must accept the terms to continue.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      toast({
        variant: "success",
        title: "Account created",
        description: "Demo only — check your email to verify your address."
      });
    }, 900);
  }

  const barPct = (strength.score / 4) * 100;

  return (
    <div className="space-y-6">
      <OAuthButtons />

      <div className="flex items-center gap-3" role="separator" aria-orientation="horizontal">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{en.auth.orSeparator}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reg-name">{en.auth.fullName}</Label>
          <Input
            id="reg-name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "reg-name-error" : undefined}
            placeholder="Meriem Laouar"
          />
          {errors.name ? (
            <p id="reg-name-error" className="text-xs text-destructive">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-email">{en.auth.email}</Label>
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "reg-email-error" : undefined}
            placeholder="you@company.dz"
          />
          {errors.email ? (
            <p id="reg-email-error" className="text-xs text-destructive">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-org">{en.auth.organization}</Label>
          <Input
            id="reg-org"
            autoComplete="organization"
            value={values.organization}
            onChange={(e) =>
              setValues((v) => ({ ...v, organization: e.target.value }))
            }
            aria-invalid={Boolean(errors.organization)}
            aria-describedby={errors.organization ? "reg-org-error" : undefined}
            placeholder="HISN Technologies"
          />
          {errors.organization ? (
            <p id="reg-org-error" className="text-xs text-destructive">
              {errors.organization}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-password">{en.auth.password}</Label>
          <PasswordInput
            id="reg-password"
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            aria-invalid={Boolean(errors.password)}
            aria-describedby="reg-password-strength"
            placeholder="Create a strong password"
          />

          {/* Strength meter */}
          <div id="reg-password-strength" className="space-y-2 pt-1">
            <div className="flex items-center gap-3">
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-border"
                role="progressbar"
                aria-valuenow={strength.score}
                aria-valuemin={0}
                aria-valuemax={4}
                aria-label="Password strength"
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    BAR_COLOR[strength.score]
                  )}
                  style={{ width: `${barPct}%` }}
                />
              </div>
              <span
                className={cn(
                  "w-16 text-right text-xs font-medium",
                  TEXT_COLOR[strength.score]
                )}
              >
                {strength.label}
              </span>
            </div>
            <ul className="grid grid-cols-2 gap-1.5">
              {strength.checks.map((check) => (
                <li
                  key={check.label}
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    check.met
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  )}
                >
                  <Check
                    className={cn(
                      "size-3.5 shrink-0",
                      !check.met && "opacity-30"
                    )}
                    aria-hidden="true"
                  />
                  {check.label}
                </li>
              ))}
            </ul>
          </div>
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label className="flex items-start gap-2.5 text-sm text-foreground">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              aria-invalid={Boolean(errors.terms)}
              className="mt-0.5 size-4 rounded border-input text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
            <span className="leading-relaxed text-muted-foreground">
              I agree to the{" "}
              <Link
                href="/docs"
                className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/docs"
                className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.terms ? (
            <p className="text-xs text-destructive">{errors.terms}</p>
          ) : null}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              {en.common.loading}
            </>
          ) : (
            en.common.createAccount
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {en.auth.haveAccount}{" "}
        <Link
          href="/login"
          className="font-medium text-emerald-600 hover:underline dark:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {en.common.signIn}
        </Link>
      </p>
    </div>
  );
}
