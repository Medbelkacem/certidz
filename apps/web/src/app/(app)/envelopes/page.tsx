"use client";

import * as React from "react";
import Link from "next/link";
import { FileSignature, MoreHorizontal } from "lucide-react";

import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@certidz/ui";

import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { cn, formatRelative } from "@/lib/utils";
import { envelopes, type EnvelopeStatus } from "@/lib/mock-data";

const PIPELINE: { status: EnvelopeStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "sent", label: "Sent" },
  { status: "in_progress", label: "In progress" },
  { status: "completed", label: "Completed" },
  { status: "declined", label: "Declined" },
  { status: "expired", label: "Expired" }
];

export default function EnvelopesPage() {
  const [filter, setFilter] = React.useState<EnvelopeStatus | "all">("all");

  const counts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of envelopes) map[e.status] = (map[e.status] ?? 0) + 1;
    return map;
  }, []);

  const filtered =
    filter === "all" ? envelopes : envelopes.filter((e) => e.status === filter);

  return (
    <div>
      <PageHeader
        title="Envelopes"
        description="Track every signature request from draft to completion."
        actions={
          <Button asChild variant="gold">
            <Link href="/envelopes/new">
              <FileSignature aria-hidden="true" /> New envelope
            </Link>
          </Button>
        }
      />

      {/* Status pipeline filter pills */}
      <div
        className="mb-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter envelopes by status"
      >
        <button
          type="button"
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
          className={cn(
            "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            filter === "all"
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          All
          <span className="rounded-full bg-black/10 px-1.5 text-xs dark:bg-white/10">
            {envelopes.length}
          </span>
        </button>
        {PIPELINE.map((p) => {
          const active = filter === p.status;
          return (
            <button
              key={p.status}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(p.status)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
              <span className="rounded-full bg-black/10 px-1.5 text-xs dark:bg-white/10">
                {counts[p.status] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Envelope</TableHead>
              <TableHead scope="col">Recipients</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col" className="w-48">
                Progress
              </TableHead>
              <TableHead scope="col">Updated</TableHead>
              <TableHead scope="col" className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((env) => {
              const total = env.signers.length;
              const done = env.signers.filter((s) => s.done).length;
              const pct = total === 0 ? 0 : Math.round((done / total) * 100);
              const updated = env.sentAt ?? env.dueAt;
              return (
                <TableRow key={env.id}>
                  <TableCell>
                    <p className="max-w-xs truncate text-sm font-medium text-foreground">
                      {env.subject}
                    </p>
                    <p className="max-w-xs truncate text-xs text-muted-foreground">
                      {env.document}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {total === 0 ? "—" : `${total} recipient${total > 1 ? "s" : ""}`}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={env.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${done} of ${total} signed`}
                      >
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            env.status === "completed"
                              ? "bg-emerald-500"
                              : "bg-gold-400"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                        {done}/{total}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {updated ? formatRelative(updated) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Actions for ${env.subject}`}
                        >
                          <MoreHorizontal aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Send reminder</DropdownMenuItem>
                        <DropdownMenuItem>Download</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          Void envelope
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
