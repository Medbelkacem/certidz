import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { OtpForm } from "@/components/auth/otp-form";
import { en } from "@/lib/i18n/en";

export const metadata: Metadata = {
  title: "Two-step verification",
  description: "Enter the 6-digit code from your authenticator app."
};

export default function VerifyMfaPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <span className="inline-flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            {en.auth.mfaTitle}
          </h1>
          <p className="text-sm text-muted-foreground">{en.auth.mfaSubtitle}</p>
        </div>
      </div>
      <OtpForm />
    </div>
  );
}
