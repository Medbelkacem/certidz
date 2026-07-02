"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  GripVertical,
  Plus,
  Send,
  Trash2,
  UploadCloud
} from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  toast
} from "@certidz/ui";

import { PageHeader } from "@/components/app/page-header";
import { cn } from "@/lib/utils";

type AuthMethod = "email" | "sms" | "id_document" | "passkey";

interface SignerRow {
  id: number;
  name: string;
  email: string;
  auth: AuthMethod;
}

const AUTH_OPTIONS: { value: AuthMethod; label: string }[] = [
  { value: "email", label: "Email OTP" },
  { value: "sms", label: "SMS OTP" },
  { value: "id_document", label: "ID document + liveness" },
  { value: "passkey", label: "Passkey" }
];

const STEPS = ["Upload", "Add signers", "Review & send"] as const;

let signerSeq = 3;

export default function NewEnvelopePage() {
  const [step, setStep] = React.useState(0);
  const [fileName, setFileName] = React.useState<string | null>(
    "Convention cadre — Saharatech Énergie 2026.pdf"
  );
  const [subject, setSubject] = React.useState("Signature — Convention cadre 2026");
  const [sequential, setSequential] = React.useState(true);
  const [signers, setSigners] = React.useState<SignerRow[]>([
    { id: 1, name: "Amine Benali", email: "a.benali@hisn.dz", auth: "passkey" },
    {
      id: 2,
      name: "Rachid Hamidou",
      email: "r.hamidou@saharatech.dz",
      auth: "id_document"
    }
  ]);

  const addSigner = () =>
    setSigners((rows) => [
      ...rows,
      { id: ++signerSeq, name: "", email: "", auth: "email" }
    ]);

  const removeSigner = (id: number) =>
    setSigners((rows) => rows.filter((r) => r.id !== id));

  const updateSigner = (id: number, patch: Partial<SignerRow>) =>
    setSigners((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const canNext =
    (step === 0 && Boolean(fileName)) ||
    (step === 1 && signers.length > 0) ||
    step === 2;

  return (
    <div>
      <PageHeader
        title="New envelope"
        breadcrumbs={[
          { label: "Envelopes", href: "/envelopes" },
          { label: "New envelope" }
        ]}
        description="Prepare a document, add signers and send it for signature."
      />

      {/* Stepper */}
      <ol className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                    done && "border-transparent bg-emerald-500 text-white",
                    active && "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    !done && !active && "border-border bg-card text-muted-foreground"
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? <Check className="size-4" aria-hidden="true" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-sm font-medium sm:block",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-px flex-1 transition-colors",
                    i < step ? "bg-emerald-500" : "bg-border"
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <Card>
        <CardContent className="p-6">
          {/* Step 1 — Upload */}
          {step === 0 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="subject">Envelope subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Signature — NDA mutuel"
                />
              </div>
              <div className="space-y-2">
                <Label>Document</Label>
                {fileName ? (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <FileText className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">842 KB • PDF</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Remove document"
                      onClick={() => setFileName(null)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setFileName("Convention cadre — Saharatech Énergie 2026.pdf")
                    }
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-12 text-center transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <UploadCloud className="size-6" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      Drop a PDF here or click to browse
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF, DOCX up to 25 MB — a fingerprint is sealed on upload
                    </span>
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {/* Step 2 — Signers */}
          {step === 1 ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Signing order</h2>
                  <p className="text-xs text-muted-foreground">
                    Choose whether signers act one after another or all at once.
                  </p>
                </div>
                <div
                  className="flex items-center rounded-lg border border-border bg-card p-0.5"
                  role="group"
                  aria-label="Signing order"
                >
                  <button
                    type="button"
                    aria-pressed={sequential}
                    onClick={() => setSequential(true)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      sequential
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Sequential
                  </button>
                  <button
                    type="button"
                    aria-pressed={!sequential}
                    onClick={() => setSequential(false)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      !sequential
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Parallel
                  </button>
                </div>
              </div>

              <ul className="space-y-3">
                {signers.map((signer, i) => (
                  <li
                    key={signer.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-end"
                  >
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <GripVertical
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {sequential ? i + 1 : "•"}
                      </span>
                    </div>
                    <div className="grid flex-1 gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`name-${signer.id}`} className="text-xs">
                          Full name
                        </Label>
                        <Input
                          id={`name-${signer.id}`}
                          value={signer.name}
                          placeholder="Full name"
                          onChange={(e) =>
                            updateSigner(signer.id, { name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`email-${signer.id}`} className="text-xs">
                          Email
                        </Label>
                        <Input
                          id={`email-${signer.id}`}
                          type="email"
                          value={signer.email}
                          placeholder="name@company.dz"
                          onChange={(e) =>
                            updateSigner(signer.id, { email: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`auth-${signer.id}`} className="text-xs">
                          Authentication
                        </Label>
                        <select
                          id={`auth-${signer.id}`}
                          value={signer.auth}
                          onChange={(e) =>
                            updateSigner(signer.id, {
                              auth: e.target.value as AuthMethod
                            })
                          }
                          className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          {AUTH_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove signer ${signer.name || i + 1}`}
                      onClick={() => removeSigner(signer.id)}
                      disabled={signers.length === 1}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>

              <Button variant="outline" onClick={addSigner}>
                <Plus aria-hidden="true" /> Add signer
              </Button>
            </div>
          ) : null}

          {/* Step 3 — Review */}
          {step === 2 ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Summary</h2>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <dt className="text-xs text-muted-foreground">Subject</dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">{subject}</dd>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <dt className="text-xs text-muted-foreground">Document</dt>
                    <dd className="mt-1 truncate text-sm font-medium text-foreground">
                      {fileName ?? "—"}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <dt className="text-xs text-muted-foreground">Signing order</dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">
                      {sequential ? "Sequential" : "Parallel"}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <dt className="text-xs text-muted-foreground">Signers</dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">
                      {signers.length}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  Signing sequence
                </h3>
                <ol className="space-y-2">
                  {signers.map((s, i) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {sequential ? i + 1 : "•"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {s.name || "Unnamed signer"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                        {AUTH_OPTIONS.find((o) => o.value === s.auth)?.label}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Wizard controls */}
      <div className="mt-6 flex items-center justify-between">
        {step === 0 ? (
          <Button asChild variant="ghost">
            <Link href="/envelopes">
              <ArrowLeft aria-hidden="true" /> Cancel
            </Link>
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft aria-hidden="true" /> Back
          </Button>
        )}

        {step < STEPS.length - 1 ? (
          <Button
            variant="gold"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue <ArrowRight aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="gold"
            onClick={() =>
              toast({
                title: "Envelope sent",
                description: `${signers.length} signer(s) notified.`,
                variant: "success"
              })
            }
          >
            <Send aria-hidden="true" /> Send envelope
          </Button>
        )}
      </div>
    </div>
  );
}
