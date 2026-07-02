"use client";

import * as React from "react";
import Link from "next/link";
import { Fingerprint, Loader2 } from "lucide-react";

import { Button, Input, Label, toast } from "@certidz/ui";

import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { PasswordInput } from "@/components/auth/password-input";
import { en } from "@/lib/i18n/en";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>(
    {}
  );
  const [submitting, setSubmitting] = React.useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      toast({
        variant: "success",
        title: "Verifying your identity",
        description: "Demo only — continue to two-step verification."
      });
    }, 800);
  }

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() =>
          toast({
            title: en.auth.usePasskey,
            description: "Demo only — no passkey is registered on this device."
          })
        }
      >
        <Fingerprint aria-hidden="true" />
        {en.auth.usePasskey}
      </Button>

      <OAuthButtons />

      <div className="flex items-center gap-3" role="separator" aria-orientation="horizontal">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{en.auth.orSeparator}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">{en.auth.email}</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            placeholder="you@company.dz"
          />
          {errors.email ? (
            <p id="login-email-error" className="text-xs text-destructive">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">{en.auth.password}</Label>
            <Link
              href="/login"
              className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              {en.auth.forgotPassword}
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            placeholder="••••••••"
          />
          {errors.password ? (
            <p id="login-password-error" className="text-xs text-destructive">
              {errors.password}
            </p>
          ) : null}
        </div>

        <label className="flex items-center gap-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            className="size-4 rounded border-input text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          Remember this device for 30 days
        </label>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              {en.common.loading}
            </>
          ) : (
            en.common.signIn
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {en.auth.noAccount}{" "}
        <Link
          href="/register"
          className="font-medium text-emerald-600 hover:underline dark:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {en.common.createAccount}
        </Link>
      </p>
    </div>
  );
}
