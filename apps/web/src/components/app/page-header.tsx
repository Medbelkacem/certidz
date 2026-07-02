import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Breadcrumb[];
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs
}: PageHeaderProps) {
  return (
    <header className="mb-6 space-y-3">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <Fragment key={`${crumb.label}-${i}`}>
                  <li>
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className="rounded-sm transition-colors hover:text-foreground"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        className={isLast ? "font-medium text-foreground" : undefined}
                        aria-current={isLast ? "page" : undefined}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                  {!isLast ? (
                    <li aria-hidden="true">
                      <ChevronRight className="size-3.5" />
                    </li>
                  ) : null}
                </Fragment>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
