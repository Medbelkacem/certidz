/**
 * CertiDZ i18n — English dictionary.
 *
 * Pattern: every user-facing string lives in a locale dictionary keyed by
 * feature. Adding French/Arabic means creating `fr.ts` / `ar.ts` with the
 * same `Dictionary` shape and registering them in `getDictionary`.
 * Arabic renders RTL — `dirFor(locale)` feeds the `dir` attribute in the
 * root layout.
 */

export const locales = ["en", "fr", "ar"] as const;
export type Locale = (typeof locales)[number];

const RTL_LOCALES: readonly Locale[] = ["ar"];

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

export const en = {
  common: {
    brand: "CertiDZ",
    byline: "by HISN",
    tagline: "The Trusted AI-Powered Digital Trust Platform for Algeria & Africa",
    getStarted: "Get started",
    requestDemo: "Request a demo",
    signIn: "Sign in",
    signOut: "Sign out",
    createAccount: "Create account",
    learnMore: "Learn more",
    viewAll: "View all",
    search: "Search",
    cancel: "Cancel",
    save: "Save changes",
    continue: "Continue",
    back: "Back",
    loading: "Loading…",
    comingSoon: "Coming soon"
  },

  nav: {
    product: "Product",
    pricing: "Pricing",
    docs: "Docs",
    about: "About",
    contact: "Contact",
    dashboard: "Open dashboard"
  },

  hero: {
    eyebrow: "eIDAS-ready • Law 15-04 compliant",
    title: "Sign. Verify. Trust.",
    titleHintAr: "وقّع. تحقّق. بثقة.",
    titleHintFr: "Signez. Vérifiez. En toute confiance.",
    subtitle:
      "CertiDZ is the sovereign digital-trust platform for Algeria and Africa — qualified e-signatures, AI-powered identity verification, and PKI certificates in one secure workspace.",
    ctaPrimary: "Start signing free",
    ctaSecondary: "Talk to sales"
  },

  pillars: {
    heading: "One platform, every layer of trust",
    subheading:
      "From the first signature to long-term archival, CertiDZ covers the full lifecycle of digital trust.",
    items: {
      signatures: {
        title: "Electronic Signatures",
        description:
          "Simple, advanced and qualified signatures with tamper-evident audit trails and long-term validation."
      },
      identity: {
        title: "Identity Verification",
        description:
          "Verify national ID cards, passports and liveness in seconds — tuned for Algerian and African documents."
      },
      ai: {
        title: "AI Intelligence",
        description:
          "Summarize contracts, flag risky clauses and extract obligations with an assistant that understands FR, AR and EN."
      },
      compliance: {
        title: "Compliance & PKI",
        description:
          "Managed X.509 certificates, hash-chained audit logs and evidence packages built for regulators."
      }
    }
  },

  howItWorks: {
    heading: "How it works",
    subheading: "Three steps from document to legally binding signature.",
    steps: [
      {
        title: "Upload",
        description:
          "Drop in a PDF or start from a template. CertiDZ seals a fingerprint of the document instantly."
      },
      {
        title: "Verify & sign",
        description:
          "Signers prove who they are — ID document, liveness, OTP or passkey — then sign from any device."
      },
      {
        title: "Trust forever",
        description:
          "Every action lands in a hash-chained audit log with a court-ready evidence package."
      }
    ]
  },

  trustBadges: {
    heading: "Built for regulated environments",
    items: ["eIDAS-ready", "Algeria Law 15-04", "ISO/IEC 27001 aligned", "RGPD / Data residency: Algeria"]
  },

  stats: {
    documentsSigned: "Documents signed",
    verifications: "Identities verified",
    uptime: "Platform uptime",
    institutions: "Institutions onboard"
  },

  testimonials: {
    heading: "Trusted by teams who can't afford doubt",
    subheading: "Banks, ministries and fast-growing companies run their signatures on CertiDZ."
  },

  cta: {
    title: "Ready to make trust your default?",
    subtitle:
      "Join the platform securing Algeria's digital transformation. Free for individuals, transparent pricing for teams.",
    button: "Create your free account"
  },

  footer: {
    product: "Product",
    company: "Company",
    resources: "Resources",
    legal: "Legal",
    rights: "All rights reserved.",
    madeIn: "Built in Algeria 🇩🇿 for Africa."
  },

  auth: {
    loginTitle: "Welcome back",
    loginSubtitle: "Sign in to your CertiDZ workspace.",
    registerTitle: "Create your account",
    registerSubtitle: "Start signing in minutes. No credit card required.",
    mfaTitle: "Two-step verification",
    mfaSubtitle: "Enter the 6-digit code from your authenticator app.",
    email: "Work email",
    password: "Password",
    confirmPassword: "Confirm password",
    fullName: "Full name",
    organization: "Organization",
    forgotPassword: "Forgot password?",
    noAccount: "No account yet?",
    haveAccount: "Already have an account?",
    continueWithGoogle: "Continue with Google",
    continueWithMicrosoft: "Continue with Microsoft",
    usePasskey: "Sign in with a passkey",
    orSeparator: "or continue with email",
    terms: "By continuing you agree to our Terms of Service and Privacy Policy.",
    verify: "Verify code",
    resendCode: "Resend code",
    brandQuote:
      "“CertiDZ cut our contract turnaround from eleven days to four hours — and our auditors finally smile.”",
    brandQuoteAuthor: "Head of Legal, Numidia Bank"
  },

  app: {
    nav: {
      dashboard: "Dashboard",
      documents: "Documents",
      envelopes: "Envelopes",
      templates: "Templates",
      certificates: "Certificates",
      identity: "Identity",
      workflows: "Workflows",
      ai: "AI Assistant",
      analytics: "Analytics",
      audit: "Audit Logs",
      organization: "Organization",
      settings: "Settings"
    },
    topbar: {
      searchPlaceholder: "Search documents, envelopes, people…",
      searchHint: "⌘K",
      notifications: "Notifications",
      toggleTheme: "Toggle theme",
      switchOrg: "Switch organization"
    },
    kpis: {
      documentsSigned: "Documents signed",
      pendingEnvelopes: "Pending envelopes",
      verificationRate: "Verification success rate",
      activeCertificates: "Active certificates"
    },
    empty: {
      documentsTitle: "No documents yet",
      documentsBody: "Upload your first document to start collecting signatures.",
      genericAction: "Get started"
    }
  },

  pricing: {
    title: "Simple pricing, sovereign trust",
    subtitle:
      "Prices in Algerian dinar. Every plan includes hash-chained audit logs and data residency in Algeria.",
    perMonth: "/month",
    perUserMonth: "/user/month",
    contactUs: "Contact us",
    mostPopular: "Most popular",
    faqTitle: "Frequently asked questions"
  }
} as const;

export type Dictionary = typeof en;

/**
 * Locale resolver. FR and AR dictionaries plug in here; until translated
 * they fall back to English so the UI never breaks.
 */
export function getDictionary(_locale: Locale = "en"): Dictionary {
  return en;
}

/** Default locale used by the App Router layouts. */
export const DEFAULT_LOCALE: Locale = "en";
