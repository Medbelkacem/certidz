import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { en } from "@/lib/i18n/en";

export const metadata: Metadata = {
  title: "Create account",
  description: "Start signing in minutes. No credit card required."
};

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {en.auth.registerTitle}
        </h1>
        <p className="text-sm text-muted-foreground">{en.auth.registerSubtitle}</p>
      </div>
      <RegisterForm />
    </div>
  );
}
