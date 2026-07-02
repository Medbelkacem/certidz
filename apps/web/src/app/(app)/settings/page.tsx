"use client";

import * as React from "react";
import {
  Check,
  Copy,
  Download,
  Fingerprint,
  Key,
  KeyRound,
  Laptop,
  type LucideIcon,
  Monitor,
  Plus,
  ShieldCheck,
  Smartphone,
  Trash2
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  Badge,
  type BadgeProps,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast
} from "@certidz/ui";

import { PageHeader } from "@/components/app/page-header";
import { cn, formatDate, formatDZD, formatRelative, initials } from "@/lib/utils";
import { apiKeys, currentUser, organizations } from "@/lib/mock-data";
import {
  activeSessions,
  invoices,
  notificationChannels,
  passkeys,
  planUsage
} from "@/lib/app-mock-data";

const SELECT_CLASS =
  "flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const org = organizations[0];

/** Pick a device icon from the device label. */
function deviceIcon(device: string): LucideIcon {
  const d = device.toLowerCase();
  if (d.includes("iphone") || d.includes("android") || d.includes("phone")) {
    return Smartphone;
  }
  if (d.includes("windows") || d.includes("monitor") || d.includes("desktop")) {
    return Monitor;
  }
  return Laptop;
}

/* -------------------------------------------------------------------------- */
/*                             Accessible switch                              */
/* -------------------------------------------------------------------------- */

function Switch({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-emerald-500" : "bg-muted"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block size-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Invoice badge                               */
/* -------------------------------------------------------------------------- */

const INVOICE_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  Paid: "success",
  Due: "warning",
  Refunded: "secondary"
};

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your profile, organization, security and billing."
      />

      <Tabs defaultValue="profile">
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
        </div>

        <ProfileTab />
        <OrganizationTab />
        <SecurityTab />
        <ApiKeysTab />
        <BillingTab />
        <NotificationsTab />
      </Tabs>
    </div>
  );
}

/* --------------------------------- Profile -------------------------------- */

function ProfileTab() {
  return (
    <TabsContent value="profile" className="mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Update your personal details and how colleagues see you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback
                className={cn(currentUser.avatarColor, "text-lg text-white")}
              >
                {initials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                Change photo
              </Button>
              <p className="text-xs text-muted-foreground">
                PNG or JPG, up to 2 MB.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Full name</Label>
              <Input id="p-name" defaultValue={currentUser.name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-email">Work email</Label>
              <Input
                id="p-email"
                type="email"
                defaultValue={currentUser.email}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-role">Role</Label>
              <select id="p-role" className={SELECT_CLASS} defaultValue={currentUser.role}>
                <option value="Owner">Owner</option>
                <option value="Admin">Admin</option>
                <option value="Member">Member</option>
                <option value="Auditor">Auditor</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-title">Job title</Label>
              <Input id="p-title" placeholder="e.g. Head of Compliance" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-phone">Phone</Label>
              <Input id="p-phone" type="tel" placeholder="+213 …" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            variant="gold"
            onClick={() =>
              toast({
                title: "Profile updated",
                description: "Your changes have been saved.",
                variant: "success"
              })
            }
          >
            Save changes
          </Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}

/* ------------------------------ Organization ------------------------------ */

function OrganizationTab() {
  return (
    <TabsContent value="organization" className="mt-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle>Organization</CardTitle>
              <CardDescription>
                Legal and contact details used on certificates and invoices.
              </CardDescription>
            </div>
            {org ? (
              <Badge variant="gold">{org.plan} plan</Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="o-name">Organization name</Label>
              <Input id="o-name" defaultValue={org?.name ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-sector">Sector</Label>
              <Input id="o-sector" defaultValue={org?.sector ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-nif">Legal ID / NIF</Label>
              <Input id="o-nif" placeholder="e.g. 000916012345678" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-address">Address</Label>
              <Input id="o-address" placeholder="Street, city, wilaya" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            variant="gold"
            onClick={() =>
              toast({
                title: "Organization saved",
                description: "Organization details have been updated.",
                variant: "success"
              })
            }
          >
            Save
          </Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}

/* -------------------------------- Security -------------------------------- */

function SecurityTab() {
  return (
    <TabsContent value="security" className="mt-6 space-y-6">
      {/* MFA */}
      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            An extra layer of protection required at every new sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Authenticator app
                </p>
                <p className="text-xs text-muted-foreground">
                  Time-based one-time passwords (TOTP).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success">Enabled</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast({
                    title: "Manage two-factor",
                    description: "Opening two-factor settings…"
                  })
                }
              >
                Manage
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passkeys */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle>Passkeys</CardTitle>
              <CardDescription>
                Sign in with your device biometrics or a security key.
              </CardDescription>
            </div>
            <Button
              variant="gold"
              size="sm"
              onClick={() =>
                toast({
                  title: "Add passkey",
                  description: "Follow your browser prompt to register a passkey.",
                  variant: "success"
                })
              }
            >
              <Plus aria-hidden="true" /> Add passkey
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {passkeys.map((pk) => (
            <div
              key={pk.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Fingerprint className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{pk.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Added {formatDate(pk.addedAt)} • Last used{" "}
                    {formatRelative(pk.lastUsedAt)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() =>
                  toast({
                    title: "Passkey removed",
                    description: `${pk.label} can no longer be used to sign in.`
                  })
                }
              >
                Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Active sessions */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>
            Devices currently signed in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Device</TableHead>
                <TableHead scope="col">Location</TableHead>
                <TableHead scope="col">IP</TableHead>
                <TableHead scope="col">Last active</TableHead>
                <TableHead scope="col" className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSessions.map((session) => {
                const Icon = deviceIcon(session.device);
                return (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {session.device}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.browser}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {session.location}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {session.ip}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelative(session.lastActive)}
                    </TableCell>
                    <TableCell className="text-right">
                      {session.current ? (
                        <Badge variant="success">This device</Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() =>
                            toast({
                              title: "Session revoked",
                              description: `${session.device} has been signed out.`
                            })
                          }
                        >
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

/* -------------------------------- API Keys -------------------------------- */

function ApiKeysTab() {
  const [copied, setCopied] = React.useState(false);
  const newKey = "cdz_live_9c4b••••••••••••3f21";

  const copyKey = async () => {
    try {
      await navigator.clipboard?.writeText(newKey);
    } catch {
      // Clipboard may be unavailable; still give feedback.
    }
    setCopied(true);
    toast({ title: "Copied", description: "API key copied to clipboard." });
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TabsContent value="api-keys" className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle>API keys</CardTitle>
              <CardDescription>
                Authenticate server-to-server requests to the CertiDZ API.
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="gold" size="sm">
                  <Plus aria-hidden="true" /> Create key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>API key created</DialogTitle>
                  <DialogDescription>
                    Copy your secret key now — for security reasons it won&apos;t be
                    shown again.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="k-name">Key name</Label>
                    <Input id="k-name" placeholder="e.g. Billing service" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="k-secret">Secret key</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="k-secret"
                        readOnly
                        value={newKey}
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Copy API key"
                        onClick={copyKey}
                      >
                        {copied ? (
                          <Check aria-hidden="true" />
                        ) : (
                          <Copy aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Scopes default to <code className="font-mono">envelopes:write</code>{" "}
                      and <code className="font-mono">documents:read</code>. You can
                      refine them after creation.
                    </p>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-gold-500/10 p-3 text-sm text-gold-600 dark:text-gold-300">
                    <KeyRound className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>
                      Store this key in a secret manager. Anyone with it can act on
                      behalf of your organization.
                    </span>
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Label</TableHead>
              <TableHead scope="col">Key</TableHead>
              <TableHead scope="col">Scopes</TableHead>
              <TableHead scope="col">Created</TableHead>
              <TableHead scope="col">Last used</TableHead>
              <TableHead scope="col" className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((key) => (
              <TableRow key={key.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Key className="size-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm font-medium text-foreground">
                      {key.label}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="font-mono text-xs text-muted-foreground">
                    {key.prefix}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {key.scopes.map((scope) => (
                      <Badge key={scope} variant="outline" className="font-mono text-[10px]">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(key.createdAt)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {key.lastUsedAt ? formatRelative(key.lastUsedAt) : "Never"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() =>
                      toast({
                        title: "Key revoked",
                        description: `${key.label} can no longer authenticate requests.`
                      })
                    }
                  >
                    <Trash2 aria-hidden="true" /> Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </TabsContent>
  );
}

/* --------------------------------- Billing -------------------------------- */

function BillingTab() {
  return (
    <TabsContent value="billing" className="mt-6 space-y-6">
      {/* Current plan */}
      <Card className="glass">
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Enterprise
              </h2>
              <Badge variant="gold">Current plan</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDZD(148000)} / month — renews 1 Aug 2026.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">Manage plan</Button>
            <Button variant="gold">Upgrade</Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Usage this period</CardTitle>
          <CardDescription>
            Consumption against your plan limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {planUsage.map((item) => {
            const pct =
              item.limit > 0
                ? Math.min(100, Math.round((item.used / item.limit) * 100))
                : 0;
            const barColor =
              pct >= 90
                ? "bg-destructive"
                : pct >= 75
                  ? "bg-gold-500"
                  : "bg-emerald-500";
            const unit = item.unit ? item.unit : "";
            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.used}
                    {unit} / {item.limit}
                    {unit}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${item.label} usage`}
                  className="h-2 w-full overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className={cn("h-full rounded-full transition-all", barColor)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Download receipts for your records.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Number</TableHead>
                <TableHead scope="col">Date</TableHead>
                <TableHead scope="col">Amount</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <span className="font-mono text-xs text-foreground">
                      {invoice.number}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(invoice.date)}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {formatDZD(invoice.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={INVOICE_VARIANT[invoice.status] ?? "secondary"}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Download invoice ${invoice.number}`}
                    >
                      <Download aria-hidden="true" /> Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

/* ------------------------------ Notifications ----------------------------- */

type ChannelKind = "email" | "push" | "sms";

function NotificationsTab() {
  const [state, setState] = React.useState<
    Record<string, Record<ChannelKind, boolean>>
  >(() =>
    notificationChannels.reduce<Record<string, Record<ChannelKind, boolean>>>(
      (acc, channel) => {
        acc[channel.id] = {
          email: channel.email,
          push: channel.push,
          sms: channel.sms
        };
        return acc;
      },
      {}
    )
  );

  const toggle = (id: string, kind: ChannelKind) => {
    setState((prev) => {
      const current = prev[id] ?? { email: false, push: false, sms: false };
      return {
        ...prev,
        [id]: { ...current, [kind]: !current[kind] }
      };
    });
  };

  return (
    <TabsContent value="notifications" className="mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Choose how you want to be notified for each type of event.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {/* Column headers */}
          <div className="hidden items-center gap-4 border-b border-border px-2 pb-2 sm:flex">
            <div className="flex-1" />
            <div className="grid w-48 grid-cols-3 text-center text-xs font-medium text-muted-foreground">
              <span>Email</span>
              <span>Push</span>
              <span>SMS</span>
            </div>
          </div>

          {notificationChannels.map((channel) => {
            const values = state[channel.id] ?? {
              email: false,
              push: false,
              sms: false
            };
            return (
              <div
                key={channel.id}
                className="flex flex-col gap-3 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-4 sm:px-2"
              >
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {channel.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {channel.description}
                  </p>
                </div>
                <div className="grid w-full grid-cols-3 gap-2 sm:w-48 sm:justify-items-center">
                  {(["email", "push", "sms"] as const).map((kind) => (
                    <div
                      key={kind}
                      className="flex items-center gap-2 sm:flex-col sm:gap-0"
                    >
                      <span className="text-xs capitalize text-muted-foreground sm:hidden">
                        {kind}
                      </span>
                      <Switch
                        checked={values[kind]}
                        onChange={() => toggle(channel.id, kind)}
                        label={`${channel.label} ${kind} notifications`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            variant="gold"
            onClick={() =>
              toast({
                title: "Preferences saved",
                description: "Your notification preferences have been updated.",
                variant: "success"
              })
            }
          >
            Save preferences
          </Button>
        </CardFooter>
      </Card>
    </TabsContent>
  );
}
