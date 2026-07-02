/**
 * Typed mock data for the CertiDZ dashboard.
 * All companies are fictional; names and .dz domains are realistic for demo purposes.
 * Dates are ISO strings pinned around mid-2026 so relative labels look sane.
 */

/* ----------------------------- Status unions ----------------------------- */

export type EnvelopeStatus =
  | "draft"
  | "sent"
  | "in_progress"
  | "completed"
  | "declined"
  | "expired";

export type DocumentStatus = "draft" | "pending" | "signed" | "archived";

export type CertificateStatus = "active" | "expiring" | "revoked" | "expired";

export type IdentityStatus = "verified" | "review" | "failed" | "pending";

export type AuditSeverity = "info" | "warning" | "critical";

/* --------------------------------- Types --------------------------------- */

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member" | "Auditor";
  avatarColor: string;
}

export interface Organization {
  id: string;
  name: string;
  sector: string;
  plan: "Free" | "Pro" | "Business" | "Enterprise";
}

export interface DocumentItem {
  id: string;
  name: string;
  folder: "Contracts" | "HR" | "Finance" | "Legal" | "Procurement";
  status: DocumentStatus;
  signers: string[];
  sizeKb: number;
  updatedAt: string;
  owner: string;
}

export interface Envelope {
  id: string;
  subject: string;
  document: string;
  status: EnvelopeStatus;
  signers: { name: string; email: string; done: boolean }[];
  sentAt: string | null;
  dueAt: string | null;
}

export interface Certificate {
  id: string;
  subject: string;
  organization: string;
  serial: string;
  type: "Qualified Signature" | "Advanced Signature" | "Seal" | "TLS";
  issuedAt: string;
  expiresAt: string;
  status: CertificateStatus;
}

export interface VerificationSession {
  id: string;
  person: string;
  email: string;
  documentType: "National ID (CNIBE)" | "Passport" | "Driving licence" | "Residence permit";
  status: IdentityStatus;
  confidence: number; // 0–100
  checkedAt: string;
  channel: "Web" | "Mobile SDK" | "API";
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: number;
  category: "HR" | "Sales" | "Legal" | "Finance" | "Government";
  usedCount: number;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
  at: string;
  severity: AuditSeverity;
  hash: string;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  kind: "signature" | "envelope" | "identity" | "certificate" | "security";
}

export interface KpiStat {
  key: "documentsSigned" | "pendingEnvelopes" | "verificationRate" | "activeCertificates";
  value: string;
  delta: number; // percentage vs previous period
  deltaLabel: string;
}

export interface MonthlyMetric {
  month: string;
  value: number;
}

export interface DepartmentMetric {
  department: string;
  value: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: string;
}

/* --------------------------------- Users --------------------------------- */

export const currentUser: User = {
  id: "usr_01",
  name: "Meriem Laouar",
  email: "m.laouar@hisn.dz",
  role: "Admin",
  avatarColor: "bg-emerald-600"
};

export const teamMembers: User[] = [
  currentUser,
  { id: "usr_02", name: "Amine Benali", email: "a.benali@hisn.dz", role: "Owner", avatarColor: "bg-navy-600" },
  { id: "usr_03", name: "Yasmine Cherif", email: "y.cherif@hisn.dz", role: "Member", avatarColor: "bg-gold-600" },
  { id: "usr_04", name: "Sofiane Ziani", email: "s.ziani@hisn.dz", role: "Member", avatarColor: "bg-navy-500" },
  { id: "usr_05", name: "Nadia Mansouri", email: "n.mansouri@hisn.dz", role: "Auditor", avatarColor: "bg-emerald-700" }
];

export const organizations: Organization[] = [
  { id: "org_01", name: "HISN Technologies", sector: "Digital Trust", plan: "Enterprise" },
  { id: "org_02", name: "Numidia Bank", sector: "Banking", plan: "Enterprise" },
  { id: "org_03", name: "Saharatech Énergie", sector: "Energy", plan: "Business" },
  { id: "org_04", name: "Atlas Assurances", sector: "Insurance", plan: "Business" }
];

/* ---------------------------------- KPIs ---------------------------------- */

export const kpiStats: KpiStat[] = [
  { key: "documentsSigned", value: "12,847", delta: 18.2, deltaLabel: "vs last month" },
  { key: "pendingEnvelopes", value: "34", delta: -12.5, deltaLabel: "vs last month" },
  { key: "verificationRate", value: "98.4%", delta: 1.1, deltaLabel: "vs last month" },
  { key: "activeCertificates", value: "126", delta: 4.9, deltaLabel: "vs last month" }
];

/* -------------------------------- Documents ------------------------------- */

export const documents: DocumentItem[] = [
  {
    id: "doc_1001",
    name: "Convention cadre — Saharatech Énergie 2026.pdf",
    folder: "Contracts",
    status: "signed",
    signers: ["Amine Benali", "Rachid Hamidou"],
    sizeKb: 842,
    updatedAt: "2026-06-28T14:32:00Z",
    owner: "Meriem Laouar"
  },
  {
    id: "doc_1002",
    name: "NDA — Numidia Bank / HISN.pdf",
    folder: "Legal",
    status: "pending",
    signers: ["Yasmine Cherif", "Karim Haddad"],
    sizeKb: 213,
    updatedAt: "2026-06-30T09:05:00Z",
    owner: "Amine Benali"
  },
  {
    id: "doc_1003",
    name: "Contrat de travail — S. Ziani.pdf",
    folder: "HR",
    status: "signed",
    signers: ["Sofiane Ziani", "Nadia Mansouri"],
    sizeKb: 156,
    updatedAt: "2026-06-25T11:47:00Z",
    owner: "Nadia Mansouri"
  },
  {
    id: "doc_1004",
    name: "Bon de commande #4581 — Tassili Telecom.pdf",
    folder: "Procurement",
    status: "pending",
    signers: ["Leïla Boudjema"],
    sizeKb: 98,
    updatedAt: "2026-07-01T16:20:00Z",
    owner: "Yasmine Cherif"
  },
  {
    id: "doc_1005",
    name: "Rapport financier Q2 2026 — signé DG.pdf",
    folder: "Finance",
    status: "archived",
    signers: ["Amine Benali"],
    sizeKb: 2140,
    updatedAt: "2026-06-15T08:12:00Z",
    owner: "Meriem Laouar"
  },
  {
    id: "doc_1006",
    name: "Avenant n°2 — Bail siège Hydra.pdf",
    folder: "Legal",
    status: "draft",
    signers: [],
    sizeKb: 187,
    updatedAt: "2026-07-02T07:55:00Z",
    owner: "Meriem Laouar"
  },
  {
    id: "doc_1007",
    name: "Procès-verbal AG — Casbah Capital.pdf",
    folder: "Legal",
    status: "signed",
    signers: ["Mohamed Larbi", "Amel Khelifi", "Salima Bouaziz"],
    sizeKb: 634,
    updatedAt: "2026-06-22T13:41:00Z",
    owner: "Amine Benali"
  },
  {
    id: "doc_1008",
    name: "Offre technique — Hoggar Mining Group.pdf",
    folder: "Contracts",
    status: "draft",
    signers: [],
    sizeKb: 1275,
    updatedAt: "2026-06-29T17:30:00Z",
    owner: "Sofiane Ziani"
  }
];

export const documentFolders = ["All", "Contracts", "HR", "Finance", "Legal", "Procurement"] as const;

/* -------------------------------- Envelopes ------------------------------- */

export const envelopes: Envelope[] = [
  {
    id: "env_2201",
    subject: "Signature — Convention cadre Saharatech 2026",
    document: "Convention cadre — Saharatech Énergie 2026.pdf",
    status: "completed",
    signers: [
      { name: "Amine Benali", email: "a.benali@hisn.dz", done: true },
      { name: "Rachid Hamidou", email: "r.hamidou@saharatech.dz", done: true }
    ],
    sentAt: "2026-06-24T10:00:00Z",
    dueAt: "2026-07-01T23:59:00Z"
  },
  {
    id: "env_2202",
    subject: "NDA mutuel — Numidia Bank",
    document: "NDA — Numidia Bank / HISN.pdf",
    status: "in_progress",
    signers: [
      { name: "Yasmine Cherif", email: "y.cherif@hisn.dz", done: true },
      { name: "Karim Haddad", email: "k.haddad@numidiabank.dz", done: false }
    ],
    sentAt: "2026-06-30T09:10:00Z",
    dueAt: "2026-07-07T23:59:00Z"
  },
  {
    id: "env_2203",
    subject: "Bon de commande #4581",
    document: "Bon de commande #4581 — Tassili Telecom.pdf",
    status: "sent",
    signers: [{ name: "Leïla Boudjema", email: "l.boudjema@tassilitelecom.dz", done: false }],
    sentAt: "2026-07-01T16:25:00Z",
    dueAt: "2026-07-08T23:59:00Z"
  },
  {
    id: "env_2204",
    subject: "Avenant bail — validation interne",
    document: "Avenant n°2 — Bail siège Hydra.pdf",
    status: "draft",
    signers: [],
    sentAt: null,
    dueAt: null
  },
  {
    id: "env_2205",
    subject: "Contrat prestation — Atlas Assurances",
    document: "Contrat prestation AA-2026-114.pdf",
    status: "declined",
    signers: [
      { name: "Salima Bouaziz", email: "s.bouaziz@atlas-assurances.dz", done: false }
    ],
    sentAt: "2026-06-18T14:00:00Z",
    dueAt: "2026-06-28T23:59:00Z"
  },
  {
    id: "env_2206",
    subject: "Charte fournisseur 2026",
    document: "Charte fournisseur — Hoggar Mining.pdf",
    status: "expired",
    signers: [{ name: "Mohamed Larbi", email: "m.larbi@hoggarmining.dz", done: false }],
    sentAt: "2026-05-20T08:00:00Z",
    dueAt: "2026-06-20T23:59:00Z"
  }
];

/** Distribution for the dashboard donut. */
export const envelopeDistribution: { status: EnvelopeStatus; count: number }[] = [
  { status: "completed", count: 148 },
  { status: "in_progress", count: 21 },
  { status: "sent", count: 13 },
  { status: "draft", count: 9 },
  { status: "declined", count: 4 },
  { status: "expired", count: 3 }
];

/* ------------------------------ Certificates ------------------------------ */

export const certificates: Certificate[] = [
  {
    id: "cert_01",
    subject: "CN=Meriem Laouar, O=HISN Technologies, C=DZ",
    organization: "HISN Technologies",
    serial: "5F:A2:19:8C:4E:03:77:B1",
    type: "Qualified Signature",
    issuedAt: "2025-09-12T00:00:00Z",
    expiresAt: "2027-09-12T00:00:00Z",
    status: "active"
  },
  {
    id: "cert_02",
    subject: "CN=Amine Benali, O=HISN Technologies, C=DZ",
    organization: "HISN Technologies",
    serial: "7C:11:F0:2A:9D:55:38:E4",
    type: "Qualified Signature",
    issuedAt: "2024-08-02T00:00:00Z",
    expiresAt: "2026-08-02T00:00:00Z",
    status: "expiring"
  },
  {
    id: "cert_03",
    subject: "CN=HISN Corporate Seal, O=HISN Technologies, C=DZ",
    organization: "HISN Technologies",
    serial: "3A:E9:6B:CD:12:F8:40:97",
    type: "Seal",
    issuedAt: "2025-01-15T00:00:00Z",
    expiresAt: "2028-01-15T00:00:00Z",
    status: "active"
  },
  {
    id: "cert_04",
    subject: "CN=Karim Haddad, O=Numidia Bank, C=DZ",
    organization: "Numidia Bank",
    serial: "9B:04:D7:33:AF:61:2C:58",
    type: "Advanced Signature",
    issuedAt: "2024-03-10T00:00:00Z",
    expiresAt: "2026-03-10T00:00:00Z",
    status: "expired"
  },
  {
    id: "cert_05",
    subject: "CN=sign.certidz.dz, O=HISN Technologies, C=DZ",
    organization: "HISN Technologies",
    serial: "D2:77:1E:B5:90:4C:A3:06",
    type: "TLS",
    issuedAt: "2026-02-01T00:00:00Z",
    expiresAt: "2026-07-31T00:00:00Z",
    status: "expiring"
  },
  {
    id: "cert_06",
    subject: "CN=Salima Bouaziz, O=Atlas Assurances, C=DZ",
    organization: "Atlas Assurances",
    serial: "44:C8:0F:6A:D1:29:B7:E3",
    type: "Advanced Signature",
    issuedAt: "2025-05-22T00:00:00Z",
    expiresAt: "2027-05-22T00:00:00Z",
    status: "revoked"
  }
];

/* --------------------------- Identity verification ------------------------ */

export const verificationSessions: VerificationSession[] = [
  {
    id: "idv_9001",
    person: "Rachid Hamidou",
    email: "r.hamidou@saharatech.dz",
    documentType: "National ID (CNIBE)",
    status: "verified",
    confidence: 99,
    checkedAt: "2026-07-01T18:44:00Z",
    channel: "Web"
  },
  {
    id: "idv_9002",
    person: "Leïla Boudjema",
    email: "l.boudjema@tassilitelecom.dz",
    documentType: "Passport",
    status: "verified",
    confidence: 96,
    checkedAt: "2026-07-01T15:02:00Z",
    channel: "Mobile SDK"
  },
  {
    id: "idv_9003",
    person: "Mohamed Larbi",
    email: "m.larbi@hoggarmining.dz",
    documentType: "National ID (CNIBE)",
    status: "review",
    confidence: 74,
    checkedAt: "2026-07-01T11:30:00Z",
    channel: "Web"
  },
  {
    id: "idv_9004",
    person: "Amel Khelifi",
    email: "a.khelifi@casbahcapital.dz",
    documentType: "Driving licence",
    status: "failed",
    confidence: 41,
    checkedAt: "2026-06-30T19:15:00Z",
    channel: "API"
  },
  {
    id: "idv_9005",
    person: "Karim Haddad",
    email: "k.haddad@numidiabank.dz",
    documentType: "National ID (CNIBE)",
    status: "pending",
    confidence: 0,
    checkedAt: "2026-07-02T08:05:00Z",
    channel: "Web"
  },
  {
    id: "idv_9006",
    person: "Salima Bouaziz",
    email: "s.bouaziz@atlas-assurances.dz",
    documentType: "Residence permit",
    status: "verified",
    confidence: 93,
    checkedAt: "2026-06-29T10:48:00Z",
    channel: "Mobile SDK"
  }
];

/* -------------------------------- Workflows ------------------------------- */

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "wf_01",
    name: "Employee onboarding pack",
    description: "Contract, NDA and internal charter routed to HR, manager, then employee.",
    steps: 4,
    category: "HR",
    usedCount: 212,
    updatedAt: "2026-06-12T00:00:00Z"
  },
  {
    id: "wf_02",
    name: "Sales contract dual-sign",
    description: "Account executive prepares, legal reviews, both parties sign in parallel.",
    steps: 3,
    category: "Sales",
    usedCount: 458,
    updatedAt: "2026-06-27T00:00:00Z"
  },
  {
    id: "wf_03",
    name: "Board resolution with seal",
    description: "Sequential signatures from board members, finished with the corporate seal.",
    steps: 5,
    category: "Legal",
    usedCount: 37,
    updatedAt: "2026-05-30T00:00:00Z"
  },
  {
    id: "wf_04",
    name: "Loan agreement (KYC first)",
    description: "Identity verification gate before any signature step. Numidia Bank standard.",
    steps: 6,
    category: "Finance",
    usedCount: 129,
    updatedAt: "2026-06-20T00:00:00Z"
  },
  {
    id: "wf_05",
    name: "Public tender submission",
    description: "Qualified signatures + timestamping for marchés publics submissions.",
    steps: 4,
    category: "Government",
    usedCount: 64,
    updatedAt: "2026-06-02T00:00:00Z"
  },
  {
    id: "wf_06",
    name: "Insurance claim approval",
    description: "Claimant uploads, expert validates, manager signs the settlement.",
    steps: 3,
    category: "Finance",
    usedCount: 301,
    updatedAt: "2026-06-25T00:00:00Z"
  }
];

/* -------------------------------- Audit log ------------------------------- */

export const auditEvents: AuditEvent[] = [
  {
    id: "aud_5001",
    actor: "m.laouar@hisn.dz",
    action: "envelope.sent",
    target: "env_2203 — Bon de commande #4581",
    ip: "105.98.44.12",
    at: "2026-07-01T16:25:11Z",
    severity: "info",
    hash: "a3f91c0d77be24e8b6f0d1c9a25e83b4f61c02d9e8a7b3c4d5e6f70819a2c21b"
  },
  {
    id: "aud_5002",
    actor: "k.haddad@numidiabank.dz",
    action: "document.viewed",
    target: "doc_1002 — NDA Numidia Bank",
    ip: "41.111.203.87",
    at: "2026-07-01T14:03:47Z",
    severity: "info",
    hash: "b7e20a5f9c318d46e2a0b8c7d6f5e4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7"
  },
  {
    id: "aud_5003",
    actor: "system",
    action: "certificate.expiry_warning",
    target: "cert_02 — CN=Amine Benali",
    ip: "—",
    at: "2026-07-01T06:00:00Z",
    severity: "warning",
    hash: "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2"
  },
  {
    id: "aud_5004",
    actor: "a.khelifi@casbahcapital.dz",
    action: "identity.verification_failed",
    target: "idv_9004 — Driving licence",
    ip: "154.121.9.240",
    at: "2026-06-30T19:15:29Z",
    severity: "warning",
    hash: "d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9e8f7d6c5b4a3f2e1d0c9b8a7f6e5d4c3"
  },
  {
    id: "aud_5005",
    actor: "unknown",
    action: "auth.login_blocked",
    target: "usr_03 — 5 failed attempts",
    ip: "196.20.75.144",
    at: "2026-06-30T02:41:08Z",
    severity: "critical",
    hash: "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6"
  },
  {
    id: "aud_5006",
    actor: "a.benali@hisn.dz",
    action: "envelope.completed",
    target: "env_2201 — Convention Saharatech",
    ip: "105.98.44.12",
    at: "2026-06-28T14:32:55Z",
    severity: "info",
    hash: "f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1"
  },
  {
    id: "aud_5007",
    actor: "n.mansouri@hisn.dz",
    action: "audit.export",
    target: "Q2-2026 evidence package",
    ip: "105.98.44.30",
    at: "2026-06-27T09:12:33Z",
    severity: "info",
    hash: "0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f9"
  }
];

/* ----------------------------- Recent activity ---------------------------- */

export const recentActivity: ActivityItem[] = [
  {
    id: "act_01",
    actor: "Rachid Hamidou",
    action: "signed",
    target: "Convention cadre Saharatech 2026",
    at: "2026-07-02T07:12:00Z",
    kind: "signature"
  },
  {
    id: "act_02",
    actor: "Karim Haddad",
    action: "opened envelope",
    target: "NDA mutuel — Numidia Bank",
    at: "2026-07-01T14:03:00Z",
    kind: "envelope"
  },
  {
    id: "act_03",
    actor: "Leïla Boudjema",
    action: "passed identity verification",
    target: "Passport • 96% confidence",
    at: "2026-07-01T15:02:00Z",
    kind: "identity"
  },
  {
    id: "act_04",
    actor: "System",
    action: "flagged expiring certificate",
    target: "CN=Amine Benali (31 days left)",
    at: "2026-07-01T06:00:00Z",
    kind: "certificate"
  },
  {
    id: "act_05",
    actor: "Security",
    action: "blocked suspicious login",
    target: "y.cherif@hisn.dz from 196.20.75.144",
    at: "2026-06-30T02:41:00Z",
    kind: "security"
  }
];

/* -------------------------------- Analytics ------------------------------- */

export const signaturesPerMonth: MonthlyMetric[] = [
  { month: "Jan", value: 620 },
  { month: "Feb", value: 748 },
  { month: "Mar", value: 913 },
  { month: "Apr", value: 861 },
  { month: "May", value: 1104 },
  { month: "Jun", value: 1287 }
];

export const topDepartments: DepartmentMetric[] = [
  { department: "Legal", value: 412 },
  { department: "Sales", value: 388 },
  { department: "HR", value: 264 },
  { department: "Finance", value: 191 },
  { department: "Procurement", value: 118 }
];

/* ------------------------------- AI assistant ----------------------------- */

export const suggestedPrompts = [
  "Summarize this contract",
  "Find risky clauses",
  "List all obligations and deadlines",
  "Compare with our standard NDA",
  "Translate key terms to Arabic"
] as const;

export const sampleConversation: ChatMessage[] = [
  {
    id: "msg_01",
    role: "user",
    content: "Summarize the Saharatech framework agreement and flag anything unusual.",
    at: "2026-07-02T08:40:00Z"
  },
  {
    id: "msg_02",
    role: "assistant",
    content:
      "Here is the essence of the 24-page agreement:\n\n• Scope — HISN provides digital-trust services (signatures, timestamping, archival) to Saharatech Énergie for 36 months.\n• Value — 18.4M DZD/year, indexed 4% annually.\n• Liability cap — 12 months of fees, standard.\n\n⚠ Two clauses deserve attention:\n1. Article 9.3 allows termination with only 15 days notice for \"regulatory changes\" — vaguer than your usual 60-day standard.\n2. Article 14 places jurisdiction in Ouargla courts, not Algiers as in your template.",
    at: "2026-07-02T08:40:22Z"
  }
];

/* ---------------------------------- API keys ------------------------------ */

export interface ApiKey {
  id: string;
  label: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  scopes: string[];
}

export const apiKeys: ApiKey[] = [
  {
    id: "key_01",
    label: "Production — core platform",
    prefix: "cdz_live_7f3a…",
    createdAt: "2025-11-04T00:00:00Z",
    lastUsedAt: "2026-07-02T08:12:00Z",
    scopes: ["envelopes:write", "documents:read", "identity:verify"]
  },
  {
    id: "key_02",
    label: "Staging — QA automation",
    prefix: "cdz_test_c19b…",
    createdAt: "2026-03-18T00:00:00Z",
    lastUsedAt: "2026-06-29T17:45:00Z",
    scopes: ["envelopes:write", "documents:read"]
  }
];
