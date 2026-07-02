import type { Metadata } from "next";
import {
  CheckCircle2,
  Clock,
  Download,
  type LucideIcon,
  TrendingUp,
  Users
} from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@certidz/ui";

import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { cn } from "@/lib/utils";
import { signaturesPerMonth, topDepartments } from "@/lib/mock-data";
import {
  analyticsKpis,
  completionRate,
  kpiSparklines,
  topDocuments
} from "@/lib/app-mock-data";

export const metadata: Metadata = { title: "Analytics" };

const KPI_ICONS: LucideIcon[] = [TrendingUp, Clock, CheckCircle2, Users];
const KPI_SPARKS: number[][] = [
  kpiSparklines.documentsSigned ?? [1],
  kpiSparklines.pendingEnvelopes ?? [1],
  kpiSparklines.verificationRate ?? [1],
  kpiSparklines.activeCertificates ?? [1]
];

function completionBadgeVariant(rate: number) {
  if (rate >= 90) return "success" as const;
  if (rate >= 80) return "warning" as const;
  return "destructive" as const;
}

export default function AnalyticsPage() {
  const monthValues = signaturesPerMonth.map((m) => m.value);
  const monthMax = Math.max(...monthValues, 1);
  const deptMax = Math.max(...topDepartments.map((d) => d.value), 1);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Signature performance insights across your organization — volumes, completion and turnaround."
        actions={
          <Button variant="outline">
            <Download aria-hidden="true" /> Export report
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {analyticsKpis.map((kpi, i) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            delta={kpi.delta}
            deltaLabel="vs last month"
            icon={KPI_ICONS[i] ?? TrendingUp}
            sparkline={KPI_SPARKS[i] ?? [1]}
          />
        ))}
      </div>

      {/* Signatures per month + completion gauge */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Signatures per month</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="flex h-56 items-end gap-2"
              role="img"
              aria-label={`Signatures per month: ${signaturesPerMonth
                .map((m) => `${m.month} ${m.value}`)
                .join(", ")}`}
            >
              {signaturesPerMonth.map((m) => (
                <div
                  key={m.month}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {m.value}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400"
                    style={{ height: `${(m.value / monthMax) * 100}%` }}
                    title={`${m.month}: ${m.value}`}
                  />
                  <span className="text-xs text-muted-foreground">{m.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completion rate</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-4">
            <div
              className="relative size-40 rounded-full"
              role="img"
              aria-label={`Completion rate ${completionRate} percent`}
              style={{
                background: `conic-gradient(var(--color-emerald-500) 0% ${completionRate}%, var(--color-muted) ${completionRate}% 100%)`
              }}
            >
              <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-card">
                <span className="font-display text-3xl font-semibold tracking-tight text-foreground">
                  {completionRate}%
                </span>
                <span className="text-xs text-muted-foreground">completed</span>
              </div>
            </div>
            <p className="max-w-xs text-center text-sm text-muted-foreground">
              Envelopes reaching every signature this period.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top departments + top documents */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Top departments</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {topDepartments.map((d) => (
                <li key={d.department} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm text-foreground">
                    {d.department}
                  </span>
                  <div
                    className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={d.value}
                    aria-valuemin={0}
                    aria-valuemax={deptMax}
                    aria-label={`${d.department} signatures`}
                  >
                    <span
                      className="block h-full rounded-full bg-gold-500"
                      style={{ width: `${(d.value / deptMax) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm tabular-nums text-muted-foreground">
                    {d.value}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top documents</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Document</TableHead>
                    <TableHead scope="col" className="text-right">
                      Signatures
                    </TableHead>
                    <TableHead scope="col">Completion</TableHead>
                    <TableHead scope="col" className="text-right">
                      Avg. time
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topDocuments.map((doc) => (
                    <TableRow key={doc.name}>
                      <TableCell className="font-medium text-foreground">
                        {doc.name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {doc.signatures}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-20 overflow-hidden rounded-full bg-muted"
                            role="progressbar"
                            aria-valuenow={doc.completionRate}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${doc.name} completion`}
                          >
                            <span
                              className={cn(
                                "block h-full rounded-full",
                                doc.completionRate >= 90
                                  ? "bg-emerald-500"
                                  : doc.completionRate >= 80
                                    ? "bg-gold-400"
                                    : "bg-destructive"
                              )}
                              style={{ width: `${doc.completionRate}%` }}
                            />
                          </div>
                          <Badge variant={completionBadgeVariant(doc.completionRate)}>
                            {doc.completionRate}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {doc.avgHours} h
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
