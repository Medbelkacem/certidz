"use client";

import * as React from "react";
import { Download, Hash, ShieldCheck } from "lucide-react";

import {
  Badge,
  type BadgeProps,
  Button,
  Card,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@certidz/ui";

import { PageHeader } from "@/components/app/page-header";
import { cn, formatDate, formatRelative, shortHash } from "@/lib/utils";
import { auditEvents, type AuditSeverity } from "@/lib/mock-data";

const SELECT_CLASS =
  "flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Semantic Badge variant per audit severity. */
const SEVERITY_VARIANT: Record<AuditSeverity, NonNullable<BadgeProps["variant"]>> = {
  info: "secondary",
  warning: "warning",
  critical: "destructive"
};

export default function AuditPage() {
  const [action, setAction] = React.useState("all");
  const [range, setRange] = React.useState("7d");
  const [query, setQuery] = React.useState("");

  // Unique action values for the filter dropdown.
  const actionOptions = React.useMemo(
    () => Array.from(new Set(auditEvents.map((event) => event.action))).sort(),
    []
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return auditEvents.filter((event) => {
      if (action !== "all" && event.action !== action) return false;
      if (q.length > 0) {
        const haystack = `${event.actor} ${event.action} ${event.target} ${event.ip}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [action, query]);

  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="Every action is recorded in a hash-chained, tamper-evident trail — each entry is cryptographically linked to the one before it, so nothing can be altered or removed unnoticed."
        actions={
          <Button variant="outline">
            <Download aria-hidden="true" /> Export evidence
          </Button>
        }
      />

      {/* Integrity banner */}
      <Card className="glass mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-foreground">Integrity verified</h2>
            <p className="text-sm text-muted-foreground">
              All {auditEvents.length} events form an unbroken hash chain — last verified
              just now.
            </p>
          </div>
        </div>
        <Badge variant="success" className="self-start sm:self-auto">
          <ShieldCheck className="size-3.5" aria-hidden="true" /> Chain valid
        </Badge>
      </Card>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5 sm:w-56">
          <label
            htmlFor="audit-action"
            className="text-xs font-medium text-muted-foreground"
          >
            Action
          </label>
          <select
            id="audit-action"
            className={SELECT_CLASS}
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="all">All actions</option>
            {actionOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 sm:w-48">
          <label
            htmlFor="audit-range"
            className="text-xs font-medium text-muted-foreground"
          >
            Date range
          </label>
          <select
            id="audit-range"
            className={SELECT_CLASS}
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        <div className="space-y-1.5 sm:ml-auto sm:w-72">
          <label
            htmlFor="audit-search"
            className="text-xs font-medium text-muted-foreground"
          >
            Search
          </label>
          <Input
            id="audit-search"
            type="search"
            placeholder="Actor, resource or IP…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Events table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Timestamp</TableHead>
              <TableHead scope="col">Actor</TableHead>
              <TableHead scope="col">Action</TableHead>
              <TableHead scope="col">Resource</TableHead>
              <TableHead scope="col">IP</TableHead>
              <TableHead scope="col">Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((event) => {
              const isCritical = event.severity === "critical";
              const isSystem = event.actor === "system";
              return (
                <TableRow
                  key={event.id}
                  className={cn(
                    isCritical &&
                      "border-l-2 border-l-destructive bg-destructive/5"
                  )}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {formatDate(event.at)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelative(event.at)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isSystem ? (
                      <Badge variant="secondary">system</Badge>
                    ) : (
                      <span className="font-mono text-xs text-foreground">
                        {event.actor}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={SEVERITY_VARIANT[event.severity]}>
                      {event.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="block max-w-xs truncate text-sm text-muted-foreground">
                      {event.target}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {event.ip}
                    </span>
                  </TableCell>
                  <TableCell>
                    <code
                      tabIndex={0}
                      title={event.hash}
                      aria-label={`Entry hash ${event.hash}`}
                      className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Hash
                        className="size-3 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {shortHash(event.hash)}
                    </code>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filtered.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-muted-foreground">
            No events match your filters.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
