"use client";

import * as React from "react";
import { Check, IdCard, ScanFace, X } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  Badge,
  type BadgeProps,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@certidz/ui";

import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { cn, formatDate, formatRelative, initials } from "@/lib/utils";
import { type VerificationSession, verificationSessions } from "@/lib/mock-data";
import { livenessResult } from "@/lib/app-mock-data";

type MethodMeta = { label: string; variant: NonNullable<BadgeProps["variant"]> };

const METHOD_MAP: Record<VerificationSession["documentType"], MethodMeta> = {
  Passport: { label: "Passport", variant: "info" },
  "National ID (CNIBE)": { label: "CIN", variant: "success" },
  "Driving licence": { label: "Licence", variant: "warning" },
  "Residence permit": { label: "Permit", variant: "secondary" }
};

function confidenceColor(confidence: number): string {
  if (confidence >= 90) return "bg-emerald-500";
  if (confidence >= 70) return "bg-gold-400";
  return "bg-destructive";
}

function ConfidenceBar({
  confidence,
  person
}: {
  confidence: number;
  person: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 w-24 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={confidence}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Confidence for ${person}`}
      >
        <span
          className={cn("block h-full rounded-full", confidenceColor(confidence))}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="w-9 text-sm tabular-nums text-muted-foreground">
        {confidence}%
      </span>
    </div>
  );
}

function LivenessCell({ session }: { session: VerificationSession }) {
  if (session.status === "pending") {
    return <span className="text-muted-foreground">—</span>;
  }
  const pass = livenessResult[session.id] === true;
  return pass ? (
    <Badge variant="success">
      <Check className="size-3" aria-hidden="true" /> Pass
    </Badge>
  ) : (
    <Badge variant="destructive">
      <X className="size-3" aria-hidden="true" /> Fail
    </Badge>
  );
}

export default function IdentityPage() {
  const [selected, setSelected] = React.useState<VerificationSession | null>(null);

  const verifiedCount = verificationSessions.filter(
    (s) => s.status === "verified"
  ).length;
  const reviewCount = verificationSessions.filter(
    (s) => s.status === "review"
  ).length;
  const scored = verificationSessions.filter((s) => s.confidence > 0);
  const avgConfidence = scored.length
    ? Math.round(
        scored.reduce((sum, s) => sum + s.confidence, 0) / scored.length
      )
    : 0;

  const tiles = [
    { label: "Verified", value: `${verifiedCount}`, hint: "sessions passed" },
    { label: "Avg. confidence", value: `${avgConfidence}%`, hint: "across scored checks" },
    { label: "Needs review", value: `${reviewCount}`, hint: "below threshold" }
  ];

  return (
    <div>
      <PageHeader
        title="Identity verification"
        description="AI-powered ID document and liveness checks for every signer, scored in real time."
        actions={
          <Button variant="gold">
            <ScanFace aria-hidden="true" /> New verification
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.label} className="glass glass-edge p-5">
            <p className="text-sm font-medium text-muted-foreground">{tile.label}</p>
            <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
              {tile.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{tile.hint}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Person</TableHead>
                <TableHead scope="col">Method</TableHead>
                <TableHead scope="col">Confidence</TableHead>
                <TableHead scope="col">Liveness</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Checked</TableHead>
                <TableHead scope="col" className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verificationSessions.map((s) => {
                const method = METHOD_MAP[s.documentType];
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-navy-600 text-white text-[10px]">
                            {initials(s.person)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {s.person}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {s.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={method.variant}>{method.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {s.status === "pending" ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <ConfidenceBar confidence={s.confidence} person={s.person} />
                      )}
                    </TableCell>
                    <TableCell>
                      <LivenessCell session={s} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatRelative(s.checkedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected(s)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent>
          {selected ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-navy-600 text-white text-[10px]">
                      {initials(selected.person)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <DialogTitle>{selected.person}</DialogTitle>
                    <DialogDescription>{selected.email}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <dl className="grid gap-4 py-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground">
                    Document type
                  </dt>
                  <dd className="text-sm text-foreground">{selected.documentType}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground">Channel</dt>
                  <dd className="text-sm text-foreground">{selected.channel}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground">Status</dt>
                  <dd>
                    <StatusBadge status={selected.status} />
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground">Liveness</dt>
                  <dd>
                    <LivenessCell session={selected} />
                  </dd>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground">
                    Confidence
                  </dt>
                  <dd>
                    {selected.status === "pending" ? (
                      <span className="text-sm text-muted-foreground">
                        Awaiting check
                      </span>
                    ) : (
                      <ConfidenceBar
                        confidence={selected.confidence}
                        person={selected.person}
                      />
                    )}
                  </dd>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground">Checked</dt>
                  <dd className="text-sm text-foreground">
                    {formatDate(selected.checkedAt)} · {formatRelative(selected.checkedAt)}
                  </dd>
                </div>
              </dl>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
                <Button variant="gold">
                  <IdCard aria-hidden="true" /> Open full report
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
