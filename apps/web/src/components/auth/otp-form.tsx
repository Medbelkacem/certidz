"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button, Input, Label, toast } from "@certidz/ui";

import { en } from "@/lib/i18n/en";
import { cn } from "@/lib/utils";

const LENGTH = 6;
const RESEND_SECONDS = 30;

export function OtpForm() {
  const [digits, setDigits] = React.useState<string[]>(() =>
    Array.from({ length: LENGTH }, () => "")
  );
  const [recovery, setRecovery] = React.useState(false);
  const [recoveryCode, setRecoveryCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(RESEND_SECONDS);

  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    if (recovery || cooldown <= 0) return;
    const id = window.setInterval(
      () => setCooldown((c) => Math.max(0, c - 1)),
      1000
    );
    return () => window.clearInterval(id);
  }, [cooldown, recovery]);

  const code = digits.join("");

  function setDigit(index: number, value: string) {
    setError(null);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleChange(index: number, raw: string) {
    const value = raw.replace(/\D/g, "");
    if (value === "") {
      setDigit(index, "");
      return;
    }
    // Take the last typed character.
    const char = value[value.length - 1] ?? "";
    setDigit(index, char);
    if (index < LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Backspace" && digits[index] === "" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < LENGTH - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, LENGTH);
    if (!pasted) return;
    setError(null);
    const next = Array.from({ length: LENGTH }, (_, i) => pasted[i] ?? "");
    setDigits(next);
    const focusIndex = Math.min(pasted.length, LENGTH - 1);
    refs.current[focusIndex]?.focus();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (recovery) {
      if (recoveryCode.trim().length < 8) {
        setError("Enter a valid recovery code.");
        return;
      }
    } else if (code.length < LENGTH) {
      setError("Enter all six digits.");
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      toast({
        variant: "success",
        title: "Identity confirmed",
        description: "Demo only — you would now land in your dashboard."
      });
    }, 800);
  }

  function resend() {
    if (cooldown > 0) return;
    setCooldown(RESEND_SECONDS);
    toast({
      title: "Code resent",
      description: "Demo only — a new 6-digit code would be sent to your app."
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {recovery ? (
        <div className="space-y-2">
          <Label htmlFor="recovery-code">Recovery code</Label>
          <Input
            id="recovery-code"
            autoComplete="one-time-code"
            value={recoveryCode}
            onChange={(e) => {
              setError(null);
              setRecoveryCode(e.target.value);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "otp-error" : undefined}
            placeholder="xxxx-xxxx-xxxx"
            className="text-center tracking-[0.3em]"
          />
        </div>
      ) : (
        <fieldset>
          <legend className="sr-only">Enter your 6-digit verification code</legend>
          <div className="flex justify-between gap-2 sm:gap-3">
            {digits.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  refs.current[index] = el;
                }}
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                aria-label={`Digit ${index + 1}`}
                aria-invalid={Boolean(error)}
                autoFocus={index === 0}
                className={cn(
                  "size-12 p-0 text-center text-xl font-semibold sm:size-14 sm:text-2xl",
                  digit && "border-emerald-500/60"
                )}
              />
            ))}
          </div>
        </fieldset>
      )}

      {error ? (
        <p id="otp-error" className="text-center text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            {en.common.loading}
          </>
        ) : (
          en.auth.verify
        )}
      </Button>

      <div className="flex flex-col items-center gap-2 text-sm">
        {!recovery ? (
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0}
            className="font-medium text-emerald-600 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline dark:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {cooldown > 0
              ? `${en.auth.resendCode} in ${cooldown}s`
              : en.auth.resendCode}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setError(null);
            setRecovery((r) => !r);
          }}
          className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {recovery ? "Use authenticator code instead" : "Use a recovery code"}
        </button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-emerald-600 hover:underline dark:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {en.common.back} to sign in
        </Link>
      </p>
    </form>
  );
}
