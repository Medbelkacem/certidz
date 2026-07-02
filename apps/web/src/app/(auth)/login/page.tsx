import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { en } from "@/lib/i18n/en";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your CertiDZ workspace."
};

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {en.auth.loginTitle}
        </h1>
        <p className="text-sm text-muted-foreground">{en.auth.loginSubtitle}</p>
      </div>
      <LoginForm />
    </div>
  );
}
