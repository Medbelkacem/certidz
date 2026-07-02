import type { Metadata } from "next";
import { FileText, LayoutTemplate, Plus } from "lucide-react";

import {
  Badge,
  type BadgeProps,
  Button,
  Card,
  CardContent,
  CardFooter
} from "@certidz/ui";

import { PageHeader } from "@/components/app/page-header";
import { formatDate } from "@/lib/utils";
import { docTemplates, type DocTemplate } from "@/lib/app-mock-data";

export const metadata: Metadata = {
  title: "Templates"
};

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

/** Map each template category to a semantic Badge variant. */
const CATEGORY_VARIANT: Record<DocTemplate["category"], BadgeVariant> = {
  Legal: "info",
  HR: "success",
  Sales: "gold",
  Finance: "secondary",
  Government: "warning",
  Procurement: "outline"
};

export default function TemplatesPage() {
  return (
    <div>
      <PageHeader
        title="Templates"
        description="Reusable document and workflow templates — prefilled fields, clauses and routing so your team can send in seconds instead of hours."
        actions={
          <Button variant="gold">
            <Plus aria-hidden="true" /> New template
          </Button>
        }
      />

      <ul className="grid list-none grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {docTemplates.map((tpl) => {
          const variant = CATEGORY_VARIANT[tpl.category];
          return (
            <li key={tpl.id}>
              <Card className="group flex h-full flex-col transition-all hover:-translate-y-0.5 hover:shadow-glass">
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-colors group-hover:bg-emerald-500/15 dark:text-emerald-400">
                      <FileText className="size-5" aria-hidden="true" />
                    </span>
                    <Badge variant={variant}>{tpl.category}</Badge>
                  </div>

                  <div className="space-y-1">
                    <h2 className="font-medium text-foreground">{tpl.name}</h2>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {tpl.description}
                    </p>
                  </div>

                  <dl className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <dt className="sr-only">Fields</dt>
                      <dd>{tpl.fields} fields</dd>
                    </div>
                    <span aria-hidden="true">•</span>
                    <div className="flex items-center gap-1">
                      <dt className="sr-only">Times used</dt>
                      <dd>Used {tpl.usedCount}×</dd>
                    </div>
                    <span aria-hidden="true">•</span>
                    <div className="flex items-center gap-1">
                      <dt className="sr-only">Updated</dt>
                      <dd>{formatDate(tpl.updatedAt)}</dd>
                    </div>
                  </dl>
                </CardContent>

                <CardFooter className="border-t border-border p-3">
                  <Button variant="ghost" className="w-full">
                    <LayoutTemplate aria-hidden="true" /> Use template
                  </Button>
                </CardFooter>
              </Card>
            </li>
          );
        })}

        {/* Create-template CTA card */}
        <li>
          <button
            type="button"
            className="group flex h-full min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center transition-all hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-emerald-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 transition-colors group-hover:bg-emerald-500/20 dark:text-emerald-400">
              <Plus className="size-6" aria-hidden="true" />
            </span>
            <span className="space-y-1">
              <span className="block text-sm font-semibold text-foreground">
                New template
              </span>
              <span className="block text-xs text-muted-foreground">
                Start from a blank document or workflow
              </span>
            </span>
          </button>
        </li>
      </ul>
    </div>
  );
}
