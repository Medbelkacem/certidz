"use client";

import * as React from "react";
import { Loader2, Send } from "lucide-react";

import { Button, Input, Label, toast } from "@certidz/ui";

import { cn } from "@/lib/utils";

interface Errors {
  name?: string;
  email?: string;
  message?: string;
}

const TOPICS = ["Sales", "Support", "Partnership", "Careers", "Other"] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Front-end-only contact form. Validates locally and fires a success toast —
 * there is no backend call. Errors are announced via `aria-describedby`.
 */
export function ContactForm() {
  const [values, setValues] = React.useState({
    name: "",
    email: "",
    organization: "",
    topic: TOPICS[0] as string,
    message: ""
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitting, setSubmitting] = React.useState(false);

  function validate(): boolean {
    const next: Errors = {};
    if (values.name.trim().length < 2) next.name = "Please tell us your name.";
    if (!EMAIL_RE.test(values.email)) next.email = "Enter a valid email address.";
    if (values.message.trim().length < 10)
      next.message = "Your message should be at least 10 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    // Simulate a request; no backend is wired up.
    window.setTimeout(() => {
      setSubmitting(false);
      toast({
        variant: "success",
        title: "Message sent",
        description: "Our team will get back to you within one business day."
      });
      setValues({
        name: "",
        email: "",
        organization: "",
        topic: TOPICS[0] as string,
        message: ""
      });
      setErrors({});
    }, 900);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Full name</Label>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            placeholder="Meriem Laouar"
          />
          {errors.name ? (
            <p id="contact-name-error" className="text-xs text-destructive">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-email">Work email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            placeholder="you@company.dz"
          />
          {errors.email ? (
            <p id="contact-email-error" className="text-xs text-destructive">
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-org">Organization</Label>
          <Input
            id="contact-org"
            name="organization"
            autoComplete="organization"
            value={values.organization}
            onChange={(e) =>
              setValues((v) => ({ ...v, organization: e.target.value }))
            }
            placeholder="HISN Technologies"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-topic">Topic</Label>
          <select
            id="contact-topic"
            name="topic"
            value={values.topic}
            onChange={(e) => setValues((v) => ({ ...v, topic: e.target.value }))}
            className={cn(
              "flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
          >
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          placeholder="Tell us how we can help…"
          className={cn(
            "flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive"
          )}
        />
        {errors.message ? (
          <p id="contact-message-error" className="text-xs text-destructive">
            {errors.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          <>
            <Send aria-hidden="true" />
            Send message
          </>
        )}
      </Button>
    </form>
  );
}
