"use client";

import { Button, toast } from "@certidz/ui";

import { en } from "@/lib/i18n/en";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.4 5.4 0 0 1-2.4 3.58v2.97h3.86c2.26-2.08 3.56-5.15 3.56-8.79Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.86-2.97c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.79-2.11-6.74-4.96H1.28v3.06A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.26 14.31a7.2 7.2 0 0 1 0-4.62V6.63H1.28a12 12 0 0 0 0 10.74l3.98-3.06Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.96 11.96 0 0 0 12 0 12 12 0 0 0 1.28 6.63l3.98 3.06C6.21 6.85 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10.2v10.2H1z" />
      <path fill="#7FBA00" d="M12.8 1H23v10.2H12.8z" />
      <path fill="#00A4EF" d="M1 12.8h10.2V23H1z" />
      <path fill="#FFB900" d="M12.8 12.8H23V23H12.8z" />
    </svg>
  );
}

/** OAuth provider buttons. No provider is wired up — clicking fires a toast. */
export function OAuthButtons() {
  function notify(provider: string) {
    toast({
      title: `${provider} sign-in`,
      description: "Demo only — no identity provider is connected yet."
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => notify("Google")}
      >
        <GoogleIcon />
        {en.auth.continueWithGoogle}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => notify("Microsoft")}
      >
        <MicrosoftIcon />
        {en.auth.continueWithMicrosoft}
      </Button>
    </div>
  );
}
