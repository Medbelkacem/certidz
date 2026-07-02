# CertiDZ Web — `@certidz/web`

The public marketing site and authentication surface for **CertiDZ by HISN** —
_The Trusted AI-Powered Digital Trust Platform for Algeria and Africa._

Built with **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS v4**, the
shared **`@certidz/ui`** design system, **Framer Motion**, and **next-themes**.

---

## Getting started

This app lives inside the CertiDZ **pnpm + Turborepo** monorepo. Run commands
from the repository root unless noted otherwise.

```bash
# Install all workspace dependencies (Node ≥ 22, pnpm 9)
pnpm install

# Start the web app in dev mode → http://localhost:3000
pnpm --filter @certidz/web dev

# Production build & start
pnpm --filter @certidz/web build
pnpm --filter @certidz/web start

# Type-check / lint
pnpm --filter @certidz/web typecheck
pnpm --filter @certidz/web lint
```

### Docker

The image uses Next.js `output: "standalone"`. **Build from the monorepo root**
so the `@certidz/ui` workspace package resolves:

```bash
docker build -f apps/web/Dockerfile -t certidz-web .
docker run -p 3000:3000 certidz-web
```

The container runs as a non-root user and listens on port **3000**.

---

## Route map

### Marketing — `src/app/(marketing)/`

Wrapped by a layout that renders the sticky glass `MarketingNavbar`, the
`MarketingFooter`, and a `MarketingMotionProvider` (which makes every Framer
Motion animation respect `prefers-reduced-motion`).

| Route       | File                                   | Description                                                              |
| ----------- | -------------------------------------- | ------------------------------------------------------------------------ |
| `/`         | `(marketing)/page.tsx`                 | Landing: hero, trust strip, product pillars, how-it-works, stats, use-cases, testimonial, CTA |
| `/pricing`  | `(marketing)/pricing/page.tsx`         | 4 tiers (Free / Pro / Business / Enterprise), comparison table, FAQ accordion |
| `/about`    | `(marketing)/about/page.tsx`           | Mission, HISN story timeline, values, Africa reach, team grid            |
| `/docs`     | `(marketing)/docs/page.tsx`            | Documentation hub: searchable-looking card grid of sections              |
| `/contact`  | `(marketing)/contact/page.tsx`         | Contact form (client, toast on submit) + Algiers office details          |

### Auth — `src/app/(auth)/`

Split-screen shell: form column on the left, brand gradient panel with a
rotating trust quote on the right. No marketing navigation.

| Route          | File                            | Description                                                        |
| -------------- | ------------------------------- | ------------------------------------------------------------------ |
| `/login`       | `(auth)/login/page.tsx`         | Email + password, passkey button, Google/Microsoft OAuth, remember device |
| `/register`    | `(auth)/register/page.tsx`      | Name / email / org / password with a live strength meter, terms, OAuth |
| `/verify-mfa`  | `(auth)/verify-mfa/page.tsx`    | 6-digit OTP (paste + auto-advance), resend cooldown, recovery-code toggle |

> All auth forms are **front-end only** — they validate on the client and fire a
> toast. No backend or identity provider is wired up.

### App (dashboard) — planned

The authenticated product lives under `src/app/(app)/…` (dashboard, documents,
envelopes, templates, certificates, identity, workflows, AI assistant,
analytics, audit logs, organization, settings). Mock data for these screens
already exists in `src/lib/mock-data.ts`.

---

## Design system notes

Colours, fonts and effects come exclusively from the tokens defined in
`src/app/globals.css` (Tailwind v4 `@theme`). **Use these token names — do not
hard-code hex values.**

### Brand scales

- `navy-50…950` — institutional deep blue (backgrounds, hero gradient).
- `emerald-50…950` — Algeria green (success, valid signatures, primary accents).
- `gold-50…950` — premium accent for seals and badges.

### Semantic tokens (auto light/dark via the `.dark` class)

`background`, `foreground`, `card`, `card-foreground`, `popover`, `primary`,
`secondary`, `muted`, `muted-foreground`, `accent`, `destructive`, `success`,
`warning`, `border`, `input`, `ring`.

Used as Tailwind utilities, e.g. `bg-background`, `text-muted-foreground`,
`border-border`, `ring-ring`.

### Typography

- `font-display` (utility) → **Fraunces** serif for big headlines.
- `font-sans` (default body) → **Inter**.

### Custom utilities

- `glass` / `glass-edge` — glassmorphism surfaces with a subtle gold top shimmer.
- `bg-hero-gradient` — the deep-navy hero/auth brand gradient.
- `shadow-glass`, `shadow-glow-emerald`, `shadow-glow-gold`.
- `scrollbar-thin` — slim scrollbars for panels.

### Reused building blocks

- `@certidz/ui`: `Button` (variants: `default`, `gold`, `secondary`, `outline`,
  `ghost`, `destructive`, `link`), `Card`, `Input`, `Label`, `Badge`, `Table`,
  `Tabs`, `Avatar`, `toast` / `Toaster`, and more.
- `src/components/marketing/`: `MarketingNavbar`, `MarketingFooter`, `Logo`,
  `FeatureCard`, and the motion helpers `Section`, `FadeIn`, `Stagger`,
  `StaggerItem`, `MarketingMotionProvider`.
- `src/components/auth/`: `AuthBrandPanel`, `OAuthButtons`, `PasswordInput`,
  `LoginForm`, `RegisterForm`, `OtpForm`.

### Accessibility (WCAG 2.2 AA)

- Always-visible focus rings (`:focus-visible` in `globals.css` + `ring-ring`).
- Semantic landmarks, `aria-*` on interactive controls, labelled form fields
  with `aria-invalid` / `aria-describedby` error wiring.
- All motion is gated on `prefers-reduced-motion` via `useReducedMotion` and the
  global reduced-motion media query.

### Internationalisation

Every user-facing string is sourced from `src/lib/i18n/en.ts` so French and
Arabic dictionaries can be added later; `dirFor(locale)` already flips the
document to RTL for Arabic in the root layout.
