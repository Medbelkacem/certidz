/**
 * Supplementary mock data for the authenticated CertiDZ dashboard.
 * Extends (never mutates) the canonical data in `mock-data.ts`.
 * All entities are fictional; dates pinned around mid-2026.
 */

import type { LucideIcon } from "lucide-react";
import {
  FileSignature,
  IdCard,
  ShieldAlert,
  ShieldCheck,
  Stamp,
  UploadCloud
} from "lucide-react";

/* ------------------------------ Notifications ----------------------------- */

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: string;
  unread: boolean;
  kind: "signature" | "identity" | "certificate" | "security";
}

export const notifications: AppNotification[] = [
  {
    id: "ntf_01",
    title: "Envelope completed",
    body: "Rachid Hamidou signed “Convention cadre Saharatech 2026”.",
    at: "2026-07-02T07:12:00Z",
    unread: true,
    kind: "signature"
  },
  {
    id: "ntf_02",
    title: "Identity needs review",
    body: "Mohamed Larbi scored 74% — below your 80% threshold.",
    at: "2026-07-01T11:31:00Z",
    unread: true,
    kind: "identity"
  },
  {
    id: "ntf_03",
    title: "Certificate expiring",
    body: "CN=Amine Benali qualified signature expires in 31 days.",
    at: "2026-07-01T06:00:00Z",
    unread: true,
    kind: "certificate"
  },
  {
    id: "ntf_04",
    title: "Suspicious login blocked",
    body: "5 failed attempts on y.cherif@hisn.dz from 196.20.75.144.",
    at: "2026-06-30T02:41:00Z",
    unread: false,
    kind: "security"
  }
];

/* ------------------------------ Quick actions ----------------------------- */

export interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  variant: "default" | "gold" | "outline";
}

export const quickActions: QuickAction[] = [
  {
    label: "New envelope",
    description: "Send a document for signature",
    href: "/envelopes/new",
    icon: FileSignature,
    variant: "default"
  },
  {
    label: "Upload document",
    description: "Add a file to your workspace",
    href: "/documents",
    icon: UploadCloud,
    variant: "outline"
  },
  {
    label: "Verify identity",
    description: "Start an ID verification session",
    href: "/identity",
    icon: IdCard,
    variant: "gold"
  }
];

/* --------------------------- Dashboard sparklines ------------------------- */

export const kpiSparklines: Record<string, number[]> = {
  documentsSigned: [42, 55, 48, 63, 72, 68, 81, 88],
  pendingEnvelopes: [51, 47, 44, 49, 41, 38, 36, 34],
  verificationRate: [95, 96, 96, 97, 97, 98, 98, 98],
  activeCertificates: [108, 112, 115, 117, 120, 122, 124, 126]
};

export const kpiIcons: Record<string, LucideIcon> = {
  documentsSigned: FileSignature,
  pendingEnvelopes: UploadCloud,
  verificationRate: ShieldCheck,
  activeCertificates: Stamp
};

/* -------------------------- Envelope status colors ------------------------ */

/** Hex/token color per envelope status for the donut chart + legend. */
export const envelopeStatusColor: Record<string, string> = {
  completed: "var(--color-emerald-500)",
  in_progress: "var(--color-gold-400)",
  sent: "var(--color-navy-400)",
  draft: "var(--color-navy-200)",
  declined: "var(--color-destructive)",
  expired: "var(--color-gold-700)",
  voided: "var(--color-muted-foreground)"
};

export const envelopeStatusLabel: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  in_progress: "In progress",
  completed: "Completed",
  declined: "Declined",
  expired: "Expired",
  voided: "Voided"
};

/* -------------------------------- Templates ------------------------------- */

export interface DocTemplate {
  id: string;
  name: string;
  description: string;
  category: "HR" | "Sales" | "Legal" | "Finance" | "Government" | "Procurement";
  fields: number;
  usedCount: number;
  updatedAt: string;
}

export const docTemplates: DocTemplate[] = [
  {
    id: "tpl_01",
    name: "Mutual NDA (bilingual)",
    description: "Standard two-party confidentiality agreement, FR/AR clauses.",
    category: "Legal",
    fields: 8,
    usedCount: 341,
    updatedAt: "2026-06-24T00:00:00Z"
  },
  {
    id: "tpl_02",
    name: "Employment contract — CDI",
    description: "Permanent contract compliant with the Algerian labour code.",
    category: "HR",
    fields: 14,
    usedCount: 208,
    updatedAt: "2026-06-11T00:00:00Z"
  },
  {
    id: "tpl_03",
    name: "Sales quotation & terms",
    description: "Commercial offer with pricing table and acceptance signature.",
    category: "Sales",
    fields: 11,
    usedCount: 462,
    updatedAt: "2026-06-28T00:00:00Z"
  },
  {
    id: "tpl_04",
    name: "Purchase order",
    description: "Procurement PO routed to supplier for counter-signature.",
    category: "Procurement",
    fields: 9,
    usedCount: 176,
    updatedAt: "2026-06-19T00:00:00Z"
  },
  {
    id: "tpl_05",
    name: "Public tender cover letter",
    description: "Qualified-signed submission cover for marchés publics.",
    category: "Government",
    fields: 7,
    usedCount: 63,
    updatedAt: "2026-06-02T00:00:00Z"
  },
  {
    id: "tpl_06",
    name: "Loan agreement",
    description: "Consumer loan with KYC gate and amortization schedule.",
    category: "Finance",
    fields: 18,
    usedCount: 129,
    updatedAt: "2026-06-20T00:00:00Z"
  }
];

/* ---------------------------- Identity extras ----------------------------- */

/** Liveness result keyed by verification-session id. */
export const livenessResult: Record<string, boolean> = {
  idv_9001: true,
  idv_9002: true,
  idv_9003: true,
  idv_9004: false,
  idv_9005: true,
  idv_9006: true
};

/* -------------------------------- Analytics ------------------------------- */

export interface TopDocumentMetric {
  name: string;
  signatures: number;
  completionRate: number;
  avgHours: number;
}

export const topDocuments: TopDocumentMetric[] = [
  { name: "Sales quotation & terms", signatures: 462, completionRate: 94, avgHours: 3.2 },
  { name: "Mutual NDA (bilingual)", signatures: 341, completionRate: 88, avgHours: 6.1 },
  { name: "Insurance claim approval", signatures: 301, completionRate: 91, avgHours: 4.4 },
  { name: "Employment contract — CDI", signatures: 208, completionRate: 97, avgHours: 2.0 },
  { name: "Purchase order", signatures: 176, completionRate: 85, avgHours: 8.7 }
];

export const analyticsKpis: {
  label: string;
  value: string;
  delta: number;
}[] = [
  { label: "Signatures this month", value: "1,287", delta: 16.5 },
  { label: "Avg. completion time", value: "4.3 h", delta: -22.0 },
  { label: "Completion rate", value: "92%", delta: 3.4 },
  { label: "Active signers", value: "418", delta: 9.1 }
];

export const completionRate = 92; // percent, for the gauge

/* --------------------------- Settings: security --------------------------- */

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

export const activeSessions: ActiveSession[] = [
  {
    id: "ses_01",
    device: "MacBook Pro",
    browser: "Chrome 126",
    location: "Algiers, DZ",
    ip: "105.98.44.12",
    lastActive: "2026-07-02T08:40:00Z",
    current: true
  },
  {
    id: "ses_02",
    device: "iPhone 15",
    browser: "Safari Mobile",
    location: "Batna, DZ",
    ip: "41.102.18.9",
    lastActive: "2026-07-01T20:11:00Z",
    current: false
  },
  {
    id: "ses_03",
    device: "Windows 11",
    browser: "Edge 126",
    location: "Oran, DZ",
    ip: "154.121.9.240",
    lastActive: "2026-06-29T13:52:00Z",
    current: false
  }
];

export interface Passkey {
  id: string;
  label: string;
  addedAt: string;
  lastUsedAt: string;
}

export const passkeys: Passkey[] = [
  {
    id: "pk_01",
    label: "MacBook Touch ID",
    addedAt: "2026-01-14T00:00:00Z",
    lastUsedAt: "2026-07-02T08:40:00Z"
  },
  {
    id: "pk_02",
    label: "YubiKey 5C",
    addedAt: "2025-11-03T00:00:00Z",
    lastUsedAt: "2026-06-24T09:10:00Z"
  }
];

/* ---------------------------- Settings: billing --------------------------- */

export interface UsageMetric {
  label: string;
  used: number;
  limit: number;
  unit: string;
}

export const planUsage: UsageMetric[] = [
  { label: "Envelopes sent", used: 1287, limit: 5000, unit: "" },
  { label: "Identity verifications", used: 842, limit: 2000, unit: "" },
  { label: "Team members", used: 5, limit: 25, unit: "" },
  { label: "Storage", used: 34, limit: 100, unit: "GB" }
];

export interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: "Paid" | "Due" | "Refunded";
}

export const invoices: Invoice[] = [
  { id: "inv_06", number: "CDZ-2026-006", date: "2026-06-01T00:00:00Z", amount: 148000, status: "Paid" },
  { id: "inv_05", number: "CDZ-2026-005", date: "2026-05-01T00:00:00Z", amount: 148000, status: "Paid" },
  { id: "inv_04", number: "CDZ-2026-004", date: "2026-04-01T00:00:00Z", amount: 132000, status: "Paid" },
  { id: "inv_03", number: "CDZ-2026-003", date: "2026-03-01T00:00:00Z", amount: 132000, status: "Paid" }
];

/* -------------------------- Settings: notifications ----------------------- */

export interface NotificationChannel {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

export const notificationChannels: NotificationChannel[] = [
  {
    id: "nc_01",
    label: "Envelope activity",
    description: "Opened, signed, declined and completed events.",
    email: true,
    push: true,
    sms: false
  },
  {
    id: "nc_02",
    label: "Identity verification",
    description: "Results and items needing manual review.",
    email: true,
    push: false,
    sms: false
  },
  {
    id: "nc_03",
    label: "Certificate lifecycle",
    description: "Issuance, renewal reminders and revocations.",
    email: true,
    push: true,
    sms: true
  },
  {
    id: "nc_04",
    label: "Security alerts",
    description: "New sign-ins, blocked attempts and key changes.",
    email: true,
    push: true,
    sms: true
  }
];

/* ------------------------------ Approval chain ---------------------------- */

export interface ApprovalStep {
  role: string;
  actor: string;
  action: "Prepares" | "Reviews" | "Verifies" | "Signs" | "Seals";
  icon: LucideIcon;
}

export const sampleApprovalChain: ApprovalStep[] = [
  { role: "Author", actor: "Yasmine Cherif", action: "Prepares", icon: UploadCloud },
  { role: "Legal", actor: "Nadia Mansouri", action: "Reviews", icon: ShieldAlert },
  { role: "Signer", actor: "Karim Haddad", action: "Verifies", icon: IdCard },
  { role: "Executive", actor: "Amine Benali", action: "Signs", icon: FileSignature },
  { role: "Organization", actor: "HISN Seal", action: "Seals", icon: Stamp }
];
