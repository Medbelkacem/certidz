"use client";

import * as React from "react";
import {
  Download,
  Eye,
  FileText,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Search,
  Send,
  Trash2,
  UploadCloud
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
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
import { cn, formatDate, initials } from "@/lib/utils";
import { documentFolders, documents } from "@/lib/mock-data";

const PAGE_SIZE = 6;

function formatSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export default function DocumentsPage() {
  const [folder, setFolder] = React.useState<string>("All");
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<"list" | "grid">("list");
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    return documents.filter((doc) => {
      const matchFolder = folder === "All" || doc.folder === folder;
      const matchQuery = doc.name.toLowerCase().includes(query.toLowerCase());
      return matchFolder && matchQuery;
    });
  }, [folder, query]);

  React.useEffect(() => setPage(1), [folder, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const paged = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Every file in your workspace, with live signature status and quick actions."
        actions={
          <Button variant="gold">
            <UploadCloud aria-hidden="true" /> Upload document
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by folder">
          {documentFolders.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={folder === f}
              onClick={() => setFolder(f)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                folder === f
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search documents"
              placeholder="Search documents…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:w-64"
            />
          </div>
          <div
            className="flex items-center rounded-lg border border-border bg-card p-0.5"
            role="group"
            aria-label="View mode"
          >
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="size-8"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <List aria-hidden="true" />
            </Button>
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="size-8"
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
            >
              <LayoutGrid aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      {/*
        Empty-state variant: when `filtered.length === 0`, render
        <EmptyState icon={FileText} title="No documents found"
          description="Try a different folder or search, or upload a new file." />
      */}
      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border-dashed py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FileText className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">No documents found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different folder or search term.
            </p>
          </div>
        </Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.map((doc) => (
            <Card key={doc.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="size-5" aria-hidden="true" />
                </span>
                <StatusBadge status={doc.status} />
              </div>
              <p className="line-clamp-2 text-sm font-medium text-foreground">{doc.name}</p>
              <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                <span>{doc.folder}</span>
                <span>{formatSize(doc.sizeKb)}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Name</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Signers</TableHead>
                <TableHead scope="col">Size</TableHead>
                <TableHead scope="col">Updated</TableHead>
                <TableHead scope="col" className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <FileText className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="max-w-xs truncate text-sm font-medium text-foreground">
                          {doc.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{doc.folder}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell>
                    {doc.signers.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex -space-x-2">
                        {doc.signers.slice(0, 3).map((s) => (
                          <Avatar
                            key={s}
                            className="size-7 ring-2 ring-card"
                            title={s}
                          >
                            <AvatarFallback className="bg-navy-600 text-[10px] text-white">
                              {initials(s)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {doc.signers.length > 3 ? (
                          <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-card">
                            +{doc.signers.length - 3}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatSize(doc.sizeKb)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(doc.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Actions for ${doc.name}`}
                        >
                          <MoreHorizontal aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem>
                          <Eye aria-hidden="true" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send aria-hidden="true" /> Send for signature
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil aria-hidden="true" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download aria-hidden="true" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 aria-hidden="true" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination footer */}
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">{paged.length}</span> of{" "}
              <span className="font-medium text-foreground">{filtered.length}</span>{" "}
              documents
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={current <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-muted-foreground">
                Page {current} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={current >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
