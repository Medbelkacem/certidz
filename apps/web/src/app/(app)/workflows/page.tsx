import type { Metadata } from "next";
import { ArrowDown, ArrowRight, Plus, Workflow } from "lucide-react";

import {
  Badge,
  type BadgeProps,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@certidz/ui";

import { PageHeader } from "@/components/app/page-header";
import { formatDate } from "@/lib/utils";
import { sampleApprovalChain } from "@/lib/app-mock-data";
import { workflowTemplates, type WorkflowTemplate } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Workflows"
};

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

const CATEGORY_VARIANT: Record<WorkflowTemplate["category"], BadgeVariant> = {
  HR: "success",
  Sales: "gold",
  Legal: "info",
  Finance: "secondary",
  Government: "warning"
};

export default function WorkflowsPage() {
  const lastIndex = sampleApprovalChain.length - 1;

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Workflows"
          description="Automated approval routing — chain preparers, reviewers, verifiers and signers so every document follows the same compliant path."
          actions={
            <Button variant="gold">
              <Plus aria-hidden="true" /> New workflow
            </Button>
          }
        />

        <ul className="grid list-none grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workflowTemplates.map((wf) => (
            <li key={wf.id}>
              <Card className="group flex h-full flex-col transition-all hover:-translate-y-0.5 hover:shadow-glass">
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-colors group-hover:bg-emerald-500/15 dark:text-emerald-400">
                      <Workflow className="size-5" aria-hidden="true" />
                    </span>
                    <Badge variant={CATEGORY_VARIANT[wf.category]}>
                      {wf.category}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h2 className="font-medium text-foreground">{wf.name}</h2>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {wf.description}
                    </p>
                  </div>

                  <dl className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div>
                      <dt className="sr-only">Steps</dt>
                      <dd>{wf.steps} steps</dd>
                    </div>
                    <span aria-hidden="true">•</span>
                    <div>
                      <dt className="sr-only">Times used</dt>
                      <dd>Used {wf.usedCount}×</dd>
                    </div>
                    <span aria-hidden="true">•</span>
                    <div>
                      <dt className="sr-only">Updated</dt>
                      <dd>{formatDate(wf.updatedAt)}</dd>
                    </div>
                  </dl>
                </CardContent>

                <CardFooter className="border-t border-border p-3">
                  <Button variant="outline" className="w-full">
                    Use workflow
                  </Button>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      </div>

      {/* Sample approval chain */}
      <Card>
        <CardHeader>
          <CardTitle>Sample approval chain</CardTitle>
          <CardDescription>
            How a document flows through a five-step routing before it is sealed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex list-none flex-col gap-3 overflow-x-auto md:flex-row md:items-stretch md:gap-0">
            {sampleApprovalChain.map((step, i) => {
              const Icon = step.icon;
              const isLast = i === lastIndex;
              const isSeal = step.action === "Seals";
              return (
                <li
                  key={`${step.role}-${i}`}
                  className="flex flex-col items-stretch md:flex-row md:items-center"
                >
                  <div className="flex min-w-[180px] flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          isSeal
                            ? "flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-600 dark:text-gold-300"
                            : "flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {step.role}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {step.actor}
                    </p>
                    <Badge
                      variant={isSeal ? "gold" : "secondary"}
                      className="w-fit"
                    >
                      {step.action}
                    </Badge>
                  </div>

                  {!isLast ? (
                    <span
                      className="flex items-center justify-center py-1 text-muted-foreground md:px-2 md:py-0"
                      aria-hidden="true"
                    >
                      <ArrowDown className="size-5 md:hidden" />
                      <ArrowRight className="hidden size-5 md:block" />
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
