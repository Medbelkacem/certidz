"use client";

import * as React from "react";
import {
  Download,
  Eye,
  MoreHorizontal,
  RefreshCw,
  ShieldOff,
  ShieldPlus
} from "lucide-react";

import {
  Badge,
  type BadgeProps,
  Button,
  Card,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@certidz/ui";

import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { daysUntil, formatDate } from "@/lib/utils";
import { certificates } from "@/lib/mock-data";

const SELECT_CLASS =
  "flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Pull the CN=… value out of an X.500 subject string. */
function extractCommonName(subject: string): string {
  const cn = subject
    .split(",")
    .map((part) => part.trim())
    .find((part) => part.startsWith("CN="));
  return cn ? cn.slice(3) : subject;
}

interface Countdown {
  label: string;
  variant: NonNullable<BadgeProps["variant"]>;
}

/** Days-remaining badge with severity that escalates as expiry nears. */
function expiryCountdown(expiresAt: string): Countdown {
  const d = daysUntil(expiresAt);
  if (d < 0) return { label: "Expired", variant: "destructive" };
  if (d <= 30) return { label: `${d}d left`, variant: "destructive" };
  if (d <= 90) return { label: `${d}d left`, variant: "warning" };
  return { label: `${d}d left`, variant: "outline" };
}

export default function CertificatesPage() {
  const [commonName, setCommonName] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [type, setType] = React.useState("Qualified Signature");
  const [validity, setValidity] = React.useState("2");

  return (
    <div>
      <PageHeader
        title="Certificates"
        description="Managed X.509 / PKI certificates for qualified signatures, seals and TLS — issued, monitored and revoked from one place."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="gold">
                <ShieldPlus aria-hidden="true" /> Issue certificate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Issue certificate</DialogTitle>
                <DialogDescription>
                  Generate a new X.509 certificate for a subject in your
                  organization. Keys are created in the CertiDZ HSM.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cert-cn">Common name (CN)</Label>
                  <Input
                    id="cert-cn"
                    placeholder="e.g. Meriem Laouar"
                    value={commonName}
                    onChange={(e) => setCommonName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cert-org">Organization</Label>
                  <Input
                    id="cert-org"
                    placeholder="e.g. HISN Technologies"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cert-type">Certificate type</Label>
                  <select
                    id="cert-type"
                    className={SELECT_CLASS}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="Qualified Signature">Qualified Signature</option>
                    <option value="Advanced Signature">Advanced Signature</option>
                    <option value="Seal">Seal</option>
                    <option value="TLS">TLS</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cert-validity">Validity</Label>
                  <select
                    id="cert-validity"
                    className={SELECT_CLASS}
                    value={validity}
                    onChange={(e) => setValidity(e.target.value)}
                  >
                    <option value="1">1 year</option>
                    <option value="2">2 years</option>
                    <option value="3">3 years</option>
                  </select>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="gold">
                  <ShieldPlus aria-hidden="true" /> Issue certificate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Subject</TableHead>
              <TableHead scope="col">Serial</TableHead>
              <TableHead scope="col">Type</TableHead>
              <TableHead scope="col">Issued</TableHead>
              <TableHead scope="col">Expiry</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col" className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certificates.map((cert) => {
              const cn = extractCommonName(cert.subject);
              const countdown = expiryCountdown(cert.expiresAt);
              return (
                <TableRow key={cert.id}>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="max-w-xs truncate text-sm font-medium text-foreground">
                        {cn}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cert.organization}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="font-mono text-xs text-muted-foreground">
                      {cert.serial}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{cert.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(cert.issuedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(cert.expiresAt)}
                      </span>
                      <Badge variant={countdown.variant}>{countdown.label}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={cert.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Actions for ${cn}`}
                        >
                          <MoreHorizontal aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem>
                          <Eye aria-hidden="true" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download aria-hidden="true" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw aria-hidden="true" /> Renew
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <ShieldOff aria-hidden="true" /> Revoke
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
