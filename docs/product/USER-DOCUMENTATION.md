# CertiDZ User Guide

> **Audience:** End users & tenant members · **Version:** 1.0 · **Last updated:** 2026-07-02 · **Classification:** Public
>
> Product URL: **[app.certidz.dz](https://app.certidz.dz)** · Languages: **العربية / Français / English** (full right-to-left support) · Verification portal: **[verify.certidz.dz](https://app.certidz.dz/verify)**

Welcome to **CertiDZ by HISN** — the trusted, AI-powered digital-trust platform for Algeria and Africa. This guide helps you sign documents with legal effect under **Algerian Law 15-04**, send documents for signature, verify identities remotely, and automate document workflows — in Arabic, French, or English.

CertiDZ produces three signature levels, mapped 1:1 to the Algerian legal framework:

| Level | Name | What it means | Typical use |
|---|---|---|---|
| **SES** | Simple Electronic Signature | Click-to-sign with an authenticated intent record | Internal approvals, low-risk documents |
| **AdES** | Advanced Electronic Signature | Signer-unique certificate (CertiDZ Corporate PKI), sole-control key usage, tamper-evident, timestamped | Contracts, HR, procurement |
| **QES** | Qualified Electronic Signature | Certificate from an accredited Algerian CSP or eIDAS QTSP, key held in an HSM/QSCD; **handwritten-equivalent legal effect** under Law 15-04 | Notarial deeds, powers of attorney, high-value acts |

> **Tip:** Not sure which level you need? SES is fine for everyday internal sign-off. Choose AdES or QES when the document must stand up in front of an auditor, counterparty, or court. Your organization's administrator sets which levels are allowed.

---

## How to use this guide

- **Part 1** is the complete help-section outline (table of contents) covering every topic in the CertiDZ Help Center.
- **Part 2** contains **12 fully written, step-by-step walkthroughs** for the tasks you will do most often.

Throughout the guide you will see these callouts:

> 📸 **[Screenshot: what the image shows]** — a placeholder for a product screenshot.

> **Tip:** a shortcut or best practice.

> **⚠️ Warning:** something that could cause errors, lost work, or a compliance issue.

---

# PART 1 — Help-section outline

The CertiDZ Help Center is organized into the sections below. Each section lists its individual article titles.

## 1. Getting Started
- Welcome to CertiDZ — what the platform does
- Creating your account (email + password, or invitation link)
- Choosing your language (AR / FR / EN) and switching to right-to-left
- The Dashboard at a glance — Envelopes, Documents, Templates, Contacts, Reports
- Your first envelope in 5 minutes
- Understanding signature levels: SES, AdES, QES
- Desktop, tablet, and mobile — where CertiDZ works
- Glossary quick links

## 2. Your Account & Security
- Editing your profile, photo, and signature block
- Setting your default language, time zone, and date format (Gregorian / Hijri)
- Changing your password
- Managing signed-in devices and revoking sessions
- Multi-factor authentication (MFA) overview
- Passkeys and biometric sign-in (WebAuthn/FIDO2)
- Recovery codes — generating and storing them safely
- Step-up authentication for signing (why we ask again)
- What to do if you lose your phone or security key

## 3. Documents
- Uploading documents (PDF, DOCX, XLSX, PPTX, images)
- Supported file types, size limits, and virus scanning
- Organizing with folders, tags, and saved filters
- Searching documents (Arabic / French / English full-text search)
- Document versions and the frozen-signed-version rule
- Sharing a document internally and via external links
- Watermarks, passwords, and download limits on shared links
- Retention schedules and legal holds (what they mean for you)
- Deleting documents and what cannot be deleted

## 4. Sending for Signature
- Anatomy of an envelope (documents, recipients, fields, message, expiry)
- Uploading and preparing a document to send
- Adding recipients and choosing their role (Signer, Approver, Viewer/CC, Certifier)
- Placing fields (signature, initials, date, name, text, checkbox, dropdown, attachment)
- Smart field auto-placement with AI
- Writing the recipient message and setting the language
- Setting expiry and automatic reminders
- Choosing the signature level for an envelope
- Sending, tracking status, and resending
- Voiding, correcting, and reassigning an envelope
- Bulk send — one template to many recipients (CSV)

## 5. Signing
- Opening a signature request from email or SMS
- Verifying your identity before signing (authentication)
- The consent-to-electronic-business disclosure
- Adopting your signature (draw, type, or upload)
- Filling required fields and using the field navigator
- Finishing and confirming your signature
- Declining to sign, or reassigning to a colleague
- Signing on your phone
- Signing offline and syncing later (PWA)

## 6. Identity Verification
- What identity verification (IDV) is and when it is required
- Capturing your ID document (CNIBE, passport, driving licence, residence card)
- Taking a selfie and passing the liveness check
- Reading your document's NFC chip (biometric passport / CNIBE)
- Understanding your result: approved, rejected, needs review
- Reasons a verification can fail, and how to retry
- What CertiDZ does with your photos and biometric data
- The reusable "CertiDZ ID" verified profile

## 7. Templates
- What templates are and when to use them
- Creating a template from scratch
- Adding roles, fields, routing, message, and expiry to a template
- Personal vs. organization templates
- Starting an envelope from a template
- Editing and versioning templates
- Sharing templates with your team

## 8. Workflows & Approvals
- What the visual workflow builder does
- Triggers: upload, form submission, API call, schedule
- Steps: approval, signature, IDV, AI review, webhook, delay, branch
- Conditional routing (route by amount, type, or AI-extracted values)
- Parallel splits and joins
- SLA timers, deadlines, and escalation
- Testing a workflow before you activate it
- Reading a workflow's execution log
- Workflow templates gallery (procurement, HR onboarding, diploma issuance, and more)

## 9. AI Assistant
- What the AI Assistant can and cannot do (advisory only)
- Reviewing a contract: clause extraction and risk flags
- The missing-clause checklist
- Asking questions about a document (Q&A with citations)
- Document classification and smart suggestions
- Reading confidence scores and citations
- AI safety, privacy, and your tenant's opt-out

## 10. Team & Organization
- Inviting members to your organization
- Roles explained: Owner, Admin, Compliance Officer, Manager, Member, Auditor
- Changing a member's role
- Removing a member and transferring their work
- Teams, spaces, and shared folders
- Guest collaborators (external counsel)
- Organization branding (logo, colors, sender domain)
- Organization security policies (MFA, allowed signature levels, IP allowlists)

## 11. Notifications & Reminders
- Notification channels: email, in-app, SMS, push
- Setting your personal notification preferences
- Reminders on envelopes you sent
- Reminders you receive as a signer, and self-service resend
- Notifications you cannot mute (signature requests)
- Arabic/RTL email formatting

## 12. Verification & Trust
- Verifying a signed document by QR code
- Verifying by uploading the PDF
- Reading the verification report (valid / invalid, signer, timestamp, level)
- What "document modified after signing" means
- Long-Term Validation (LTV) and re-timestamping
- The certificate of completion and evidence package
- Verifying without a CertiDZ account
- Trust: CertiDZ PKI, national CA chain, and timestamp authority

## 13. Mobile & Offline (PWA)
- Installing CertiDZ as an app on your phone or desktop
- Reading documents offline
- Signing offline and syncing on reconnect
- Camera capture for identity verification
- Low-bandwidth mode
- Push notifications

## 14. Billing basics (for members)
- Understanding your plan: Free, Pro, Business, Enterprise, Government
- Seats, quotas, and metered add-ons (envelopes, IDV, API, AI credits)
- Viewing usage vs. your plan limits
- Paying in DZD (CIB / EDAHABIA via SATIM) or EUR/USD (Stripe)
- Reading a CertiDZ invoice (NIF, RC, AI, TVA 19%)
- What happens when a quota is reached
- Who can manage billing (roles)

## 15. Troubleshooting & FAQ
- "I didn't receive my signature email"
- "The signing link says expired or access denied"
- "My identity verification keeps failing"
- "The verification portal says my document is invalid"
- "I can't sign — it asks me to authenticate again"
- "The document won't upload"
- "My Arabic text or numbers look wrong"
- "I was removed from an envelope / lost access"
- Browser and device requirements
- Contacting support and what to include

## 16. Glossary
- AdES, SES, QES — the three signature levels
- Envelope, recipient, field, role
- Evidence package / certificate of completion
- LTV / LTA (Long-Term Validation / archival)
- PAdES, XAdES, CAdES, ASiC-E
- Timestamp / TSA (RFC 3161)
- CSP, CA, PKI, HSM, QSCD
- OCSP / CRL (revocation)
- Liveness, face match, MRZ, NFC, eMRTD
- Passkey / WebAuthn / step-up authentication
- Audit trail / hash chain
- Tenant, workspace, seat

---

# PART 2 — Step-by-step walkthroughs

Each walkthrough is self-contained. UI paths are written as `Section → Sub-section → Action`. Screenshot placeholders show where product images appear in the Help Center.

---

## Walkthrough 1 — Sign a document

Sign a document that someone sent you for signature. You do not need a CertiDZ account to sign as a recipient — the link in your email or SMS is enough.

**Prerequisites**
- A signature-request email (from `no-reply@certidz.dz` or your sender's branded domain) or an SMS with a signing link.
- Access to the authentication method the sender chose (email access, an SMS/email one-time code, or your CertiDZ account).
- A few minutes on a phone, tablet, or computer.

**Steps**

1. Open the signature-request email and select **Review & Sign**. On mobile, tap the link in the SMS.

   > 📸 **[Screenshot: signature-request email with a highlighted "Review & Sign" button, shown in French with the sender's logo]**

2. Confirm your identity when prompted. Depending on the sender's policy you may:
   - click the email link (email-possession check), **or**
   - enter a **6-digit one-time code** sent to your phone or email, **or**
   - sign in to your CertiDZ account.

3. Read the **consent to electronic business** disclosure. Tick **I agree to sign electronically** to continue. This consent is recorded in the evidence package (available in AR / FR / EN — switch language from the top-right selector).

   > **Tip:** You can change the page language at any time using the **AR / FR / EN** selector in the top bar. Arabic switches the whole page to right-to-left.

4. The document opens on page 1. Use the **Next field** button (or the field list on the left) to jump to each field assigned to you. Required fields are outlined in your recipient color and marked with a red asterisk.

5. When you reach your **signature** field, select it. In the **Adopt your signature** dialog choose one of:
   - **Draw** — sign with your finger, stylus, or mouse.
   - **Type** — type your name and pick a signature-style font.
   - **Upload** — upload an image of your signature (PNG/JPG on a transparent or white background).

   > 📸 **[Screenshot: "Adopt your signature" dialog open on the "Draw" tab, with Draw / Type / Upload tabs across the top]**

6. Select **Adopt and sign** to place your signature. Repeat for any **initials** and fill any remaining **date**, **name**, **text**, **checkbox**, **dropdown**, or **attachment** fields.

7. When every required field is complete, the **Finish** button becomes active. If it is still greyed out, select **Next field** to find what is missing — CertiDZ lists and deep-links every unfilled required field.

   > **⚠️ Warning:** Do not close the tab before selecting **Finish**. Your entries are only submitted when you finish; a closed tab discards unsaved input.

8. Select **Finish**. CertiDZ applies your signature (AdES or QES envelopes are cryptographically sealed and timestamped server-side, typically in under 30 seconds) and records the event — UTC timestamp, IP address, device, and authentication method — in the evidence log.

9. You will see a **Completed** confirmation. If the sender enabled it, select **Download** to save your copy now; otherwise you will receive a completion email once all parties have signed.

> **Tip:** If the sender allowed it, you can select **Other actions → Decline** or **Other actions → Reassign** instead of signing — see Walkthrough notes in the Signing help section.

---

## Walkthrough 2 — Send a document for signature

Upload a PDF, add recipients, place fields, and send it out for signature.

**Prerequisites**
- A CertiDZ account with the **Member** role or higher (Members have `documents:write` and `envelopes:send`).
- The document to sign (PDF preferred; DOCX/XLSX/PPTX/images are auto-converted to PDF). Max 100 MB per file, 500 MB per envelope.
- Recipients' names and email addresses (or phone numbers for SMS delivery).

**Steps**

1. From the **Dashboard**, go to **Envelopes → New** (the **+ New Envelope** button, top-right).

   > 📸 **[Screenshot: Dashboard with the "+ New Envelope" button highlighted in the top-right toolbar]**

2. **Upload** your document — drag it onto the drop zone or select **Upload from device**. CertiDZ runs an antivirus scan and converts non-PDF files before the editor opens. Add more files if the envelope needs several documents.

3. Select the **signature level** for this envelope (**SES**, **AdES**, or **QES**) from the level selector. Only levels your organization allows will be enabled.

   > **Tip:** For most business contracts, **AdES** gives you a tamper-evident, timestamped signature that verifies cleanly in Adobe Acrobat and the CertiDZ portal. Reserve **QES** for acts that legally require handwritten-equivalent effect.

4. Select **Add recipients**. For each recipient enter their **name** and **email** (or phone), then choose a **role**:
   - **Signer** — applies a signature.
   - **Approver** — approves without signing.
   - **Viewer / CC** — receives a copy only.
   - **Certifier** — applies the organization seal.

5. In the **Prepare** step, drag fields from the right-hand **Fields** panel onto the document: **Signature, Initials, Date, Name, Text, Checkbox, Dropdown, Attachment request**. Assign each field to a recipient using the recipient selector — fields are color-coded per recipient.

   > 📸 **[Screenshot: the Prepare editor showing a PDF with a blue "Signature" field and a green "Date" field placed for two different recipients, Fields panel on the right]**

   > **Tip:** Select **Auto-place fields** to let the AI assistant suggest signature, date, and name fields based on the document layout. Suggestions are visually distinct until you confirm them, and you can move or delete any of them.

6. Open the **Message** step. Write the subject and message recipients will see, and set each recipient's **language** (AR / FR / EN) so their email and signing page render correctly, including right-to-left for Arabic.

7. Set the **expiry** (default 30 days; configurable 1–365) and the **reminder** schedule (default: day 3, day 7, then weekly). You can override reminders per envelope.

8. Review the summary, then select **Send**. The envelope status changes to **Sent**, and each recipient receives a localized notification within about a minute.

   > **⚠️ Warning:** Once sent, you can no longer change the document itself. To fix a mistake, use **Correct** (edit fields/recipients while nobody has signed) or **Void** the envelope and start again — both actions are audited.

9. Track progress under **Envelopes → Sent**. Select the envelope to see who has viewed, signed, or is still pending, and use **Resend** to nudge a specific recipient.

---

## Walkthrough 3 — Set a signing order

Control whether recipients sign at the same time (parallel) or in a defined sequence (serial/routing), or a mix of both.

**Prerequisites**
- An envelope in **draft** with at least two recipients (see Walkthrough 2). Signing order can only be changed while the envelope is a draft.

**Steps**

1. In the envelope editor, open the **Recipients** step and turn on **Set signing order** (toggle at the top of the recipient list).

   > 📸 **[Screenshot: Recipients panel with the "Set signing order" toggle enabled and numbered order badges next to each recipient]**

2. Each recipient now shows an **order number** (1, 2, 3 …). Set the sequence:
   - **Serial / routing:** give each recipient a **different** number (1 → 2 → 3). Recipient 2 is only notified and granted access after recipient 1 completes.
   - **Parallel:** give recipients the **same** number so they are notified together and can sign in any order.
   - **Hybrid:** combine both — for example, a parallel group at step 1 (three board members share order **1**) followed by an approver at step **2** and a seal (Certifier) at step **3**.

3. Drag recipients up or down to reorder them, or edit the order number directly. Recipients with the same number form one parallel group.

   > **Tip:** A common HR pattern is Employee (1) → Manager (2) → HR (3). A board resolution is often three members at (1) signing in parallel, then the Chair as Approver at (2).

4. Confirm the routing preview at the bottom of the panel — it draws the sequence as steps so you can check it before sending.

5. Continue to place fields and send as usual (Walkthrough 2, steps 5–8).

> **⚠️ Warning:** If a serial recipient **declines**, the envelope becomes **Declined**, downstream recipients are never notified, and you receive the decline reason. Re-check your order before sending high-stakes envelopes.

> **Tip:** A recipient trying to reach the envelope before their turn receives a clear "It's not your turn yet" message (HTTP 403), never a blank error.

---

## Walkthrough 4 — Verify a signature via QR code

Confirm that a CertiDZ-signed document is authentic and unmodified — no account required. Anyone (an employer, a counterparty, an auditor) can do this.

**Prerequisites**
- The signed PDF, printed or on screen, showing the **CertiDZ verification QR code** (usually in the page footer or on the certificate of completion).
- A phone camera or QR scanner, or the file itself for upload verification.

**Steps**

1. Scan the **QR code** on the document with your phone camera. It opens the public verification portal at **app.certidz.dz/verify**. (No sign-in.)

   > 📸 **[Screenshot: a signed PDF footer showing the CertiDZ QR code and the text "Verify at app.certidz.dz/verify"]**

2. The portal fetches the sealed reference for that document and runs the checks automatically. Wait for the result banner (typically under 5 seconds).

3. Read the result banner:
   - **Green — VALID:** the signature is intact, the certificate chain is trusted, the document has not changed since signing.
   - **Red — INVALID:** the document was modified after signing, or a signature/certificate failed to validate.

   > 📸 **[Screenshot: green "VALID — signature verified" verification result with signer name, signature level, and timestamp listed below]**

4. Expand the result to review the details CertiDZ shows for a valid document:
   - **Signer identity** — name(s) and, where applicable, the organization and the certificate subject.
   - **Signature level** — SES, AdES, or QES, with the Law 15-04 classification.
   - **Timestamp** — the RFC 3161 trusted timestamp (UTC) proving when the signature existed.
   - **Certificate chain** — the issuing CA up to the trust anchor (CertiDZ Corporate PKI for AdES, or the national CA chain / eIDAS QTSP for QES).
   - **Revocation status at signing time** — OCSP/CRL check showing the certificate was valid when it was used.
   - **LTV status** — whether the signature carries embedded validation material (chain + revocation + timestamps) for long-term verification.

5. To verify a file you received digitally instead of scanning, select **Verify a document** on the portal and **upload the PDF**. Uploaded files are processed ephemerally and purged within one hour.

> **Tip:** If you get a red **"INVALID — document modified after signing"** result, do not accept the document. Ask the sender to re-issue it from CertiDZ. Even a single changed byte after signing produces this verdict.

> **⚠️ Warning:** A screenshot or reprint of a signed document cannot be verified — verification needs the original signed PDF or its QR link. A photo of a signature proves nothing on its own.

---

## Walkthrough 5 — Complete identity verification

Prove who you are remotely by scanning your ID, taking a selfie, and (on supported phones) reading your document's chip. This is often required before opening a bank account, signing a high-assurance document, or activating a service.

**Prerequisites**
- Your government ID: Algerian **CNIBE** (biometric national ID), biometric **passport**, **driving licence**, or **residence card**.
- A device with a camera. For NFC chip reading, an Android phone with NFC enabled.
- Good lighting and a few minutes. The session is resumable for 24 hours if you get interrupted.

**Steps**

1. Open the verification link (from your provider's email/SMS, or the in-app prompt) and select **Start verification**. Grant **camera** permission when asked.

   > 📸 **[Screenshot: verification start screen listing the three steps — Scan ID, Take selfie, Chip read — with a "Start verification" button]**

2. **Capture your ID.** Choose your document type, then hold the ID inside the on-screen frame. CertiDZ auto-captures when the image is sharp and reads both the **machine-readable zone (MRZ)** and the visual data. Flip to the back if prompted.

   > **Tip:** Avoid glare and shadows. Place the ID on a dark, flat surface and hold the phone steady. If capture struggles, tap the manual **capture** button.

3. Review the extracted details (name, document number, date of birth, expiry). Correct nothing here — if something is wrong, retake the photo.

4. **Take a selfie for face match and liveness.** Center your face in the oval and follow any on-screen prompt (for example, a **head turn** or **blink** challenge). CertiDZ compares your selfie to the ID portrait and checks that you are a live person, not a photo or screen.

   > 📸 **[Screenshot: selfie capture screen with a face-centering oval and a "hold still" liveness prompt]**

5. **(Optional) Read the NFC chip.** On a supported Android device, select **Scan chip** and hold the top of your phone against the biometric passport or CNIBE. CertiDZ reads the chip using the MRZ-derived key and cryptographically confirms the chip is genuine. This raises your assurance to **chip-verified**. If your device does not support NFC, CertiDZ continues with the optical result and tells you the assurance level.

6. Select **Submit**. CertiDZ returns an automated decision, usually within 30 seconds:
   - **Approved** — you passed; continue to your next step.
   - **Needs review** — a human reviewer will finish checking (for example, a chip-authentication anomaly); you will be notified of the outcome.
   - **Rejected** — verification failed. Common reasons: expired document, MRZ checksum mismatch, face did not match, liveness failed, or a photo-of-photo (spoof) was detected.

   > 📸 **[Screenshot: "Verification approved" success screen with a green check and a "Continue" button]**

7. If you are **rejected** or asked to **retry**, select **Try again** and repeat with better lighting, a genuine physical document, and your live face. Retries are allowed; each attempt is recorded.

> **⚠️ Warning:** Never submit a photo of a photo, a printout, or someone else's ID. CertiDZ's liveness and anti-spoof checks reject these, and repeated fraud attempts are flagged to the requesting organization.

> **Tip:** Your privacy is protected: raw selfie and document images are auto-purged per your provider's retention policy (90 days by default), biometric templates are encrypted, and only the verification result and audit metadata are retained.

---

## Walkthrough 6 — Download a signed PDF with the certificate of completion

Once every party has signed, download the final signed document together with its evidence — the proof you can archive or hand to an auditor or court.

**Prerequisites**
- A **completed** envelope you sent, signed, or were CC'd on.
- The `documents:read` / `envelopes:read` permission (all tenant roles have read access to their envelopes).

**Steps**

1. Go to **Dashboard → Envelopes** and open the envelope with status **Completed**. Completed envelopes also arrive by email with a download link.

   > 📸 **[Screenshot: a Completed envelope detail page with a "Download" split-button in the top-right]**

2. Select the **Download** button. Choose what to download:
   - **Signed document** — the final sealed PDF with all signatures.
   - **Certificate of completion** — the sealed PDF summary of the signing ceremony.
   - **Combined (document + certificate)** — both in one PDF.
   - **Evidence package (ZIP)** — the signed document, the certificate of completion, and the machine-readable evidence JSON.

   > 📸 **[Screenshot: the Download menu open, showing "Signed document", "Certificate of completion", "Combined PDF", and "Evidence package (ZIP)" options]**

3. Open the **certificate of completion**. It lists, for the whole envelope:
   - Every event with UTC timestamps — **sent, viewed, authenticated, signed, completed**.
   - Each signer's name, **signature level** (SES / AdES / QES), and the **authentication method** used.
   - The **SHA-256 hash chain** of document versions, proving nothing changed between steps.
   - IP address and device for each action.

4. Note that the certificate of completion is itself **platform-sealed (PAdES)** — you can drop it into the verification portal (Walkthrough 4) and confirm it is authentic.

5. Archive the **evidence package** for any document you may need to defend later. The signed document and its evidence are retained by CertiDZ for **10 years by default** (Law 15-04 archival alignment) and stored on write-once (WORM) storage, but keeping your own copy is good practice.

> **Tip:** The signed PDF validates as "Signature is valid" in Adobe Acrobat as well as in the CertiDZ portal — useful when sharing with counterparties who use other tools.

> **⚠️ Warning:** Do not edit, re-save, "print to PDF", or flatten the signed file. Any modification breaks the cryptographic signature and the document will show as **INVALID** on verification. Always share the original.

---

## Walkthrough 7 — Create and use a template

Build a reusable envelope template — document, roles, fields, and routing pre-configured — so recurring documents (NDAs, work orders, onboarding packs) go out in about a minute.

**Prerequisites**
- **Manager** role or higher to create/edit organization templates (Members can *use* org templates but not edit them). Anyone can create a **personal** template.
- The document(s) the template is based on.

**Part A — Create the template**

1. Go to **Dashboard → Templates → New template**.

2. **Upload** the base document(s), just like preparing an envelope.

   > 📸 **[Screenshot: Templates section with the "New template" button and a list of existing organization templates]**

3. Add **roles** instead of specific people — for example "Employee", "Manager", "HR". You assign real recipients later, each time you use the template.

4. In the **Prepare** step, place fields and assign each to a **role**. Set the **signing order** (Walkthrough 3) between roles if needed.

   > 📸 **[Screenshot: template editor showing fields assigned to roles "Employee" and "Manager" rather than named people]**

5. Pre-fill the **message**, default **language**, **expiry**, and **reminder** schedule.

6. Choose **Personal** (only you) or **Organization** (shared with your team, subject to role permissions), then select **Save template**.

**Part B — Start an envelope from the template**

7. Go to **Templates**, find your template, and select **Use** (or **Dashboard → Envelopes → New → From template**).

8. Assign a real **recipient** to each role (name + email/phone). Everything else — fields, routing, message, expiry — is already set.

   > **Tip:** Merge fields (like recipient name) render correctly in Arabic right-to-left, so bilingual teams can reuse one template across languages.

9. Review and **Send**.

> **⚠️ Warning:** Editing a template does **not** change envelopes already in flight — running envelopes keep the version they were sent with. Templates are versioned, so your history is preserved.

---

## Walkthrough 8 — Build an approval workflow

Use the visual workflow builder to automate a document process end-to-end — for example "upload → AI review → manager approval → signature → archive" — with conditional routing and SLA escalation, no developer required.

**Prerequisites**
- **Manager** or **Admin** role (workflow authoring is a privileged capability).
- A clear picture of your process steps and who owns each one.

**Steps**

1. Go to **Dashboard → Workflows → New workflow**. Start from a blank canvas or pick from the **templates gallery** (procurement approval, HR onboarding, notarial deed, diploma issuance, insurance claim, tender submission).

   > 📸 **[Screenshot: the visual workflow builder canvas with a left-hand palette of steps and a "New workflow" title bar]**

2. Add a **trigger** — the first block. Choose **Document uploaded**, **Form submitted**, **API call**, or **Schedule**.

3. Drag **steps** from the palette onto the canvas and connect them in order:
   - **Approval** — a person approves or rejects.
   - **Signature** — sends a signing envelope (choose the level and role).
   - **Identity verification** — requires an IDV check.
   - **AI review** — runs an AI contract review and can branch on the result.
   - **Webhook** — calls an external system.
   - **Delay** — waits a set time.
   - **Conditional branch** — routes based on a condition.
   - **Parallel split / join** — runs branches simultaneously and rejoins.

4. Configure a **conditional branch**. Set a rule on document metadata, a form field, or an AI-extracted value — for example, **"if contract value > 10,000,000 DZD → add CFO approval step"**. Test values below, equal to, and above the threshold in the next step.

   > 📸 **[Screenshot: a conditional branch node configured with the rule "amount > 10,000,000 DZD" and two outgoing paths labeled "CFO approval" and "Standard"]**

5. On each step that has an owner, set an **SLA deadline** (for example 48 hours) and an **escalation** target. When a step is overdue, CertiDZ escalates once to the escalatee and sends daily reminders after. Escalations respect the Algerian working week (Fri–Sat weekend) and your tenant's holidays.

6. Select **Validate**. The builder checks the graph — no orphan steps, no loops, every branch ends. Invalid graphs cannot be activated.

7. Select **Test run** to execute with sample data. You see each step's result step-by-step, and **no real notifications are sent**.

   > **Tip:** Always run **Test run** with boundary values (just below, exactly at, and just above any threshold) before going live — it is the fastest way to catch a mis-set condition.

8. When the test passes, select **Activate**. Monitor running instances and open any instance's **execution log** to see the step timeline, the actor, and the input/output hashes; the log is exportable.

> **⚠️ Warning:** Activating a workflow makes it live immediately for its trigger. Double-check the trigger scope (which documents/folders it applies to) so you do not route unintended documents.

---

## Walkthrough 9 — Use the AI Assistant to review a contract

Let the AI Assistant extract key clauses, flag risks, and check for missing clauses so your own review is faster. **The AI is advisory only** — you always make the final decision.

**Prerequisites**
- A document you can read (the AI respects your permissions — you can only analyze documents you have access to).
- AI features enabled for your organization (an admin can toggle this; some tenants opt out).

**Steps**

1. Open the document from **Documents** or from an envelope, then select **AI Assistant** in the right-hand panel (or **Tools → AI review**).

   > 📸 **[Screenshot: a contract open with the AI Assistant panel on the right showing "Review this contract" and "Ask a question" options]**

2. Select **Review this contract** and, if asked, confirm the **contract type** (the classifier suggests one, e.g. lease, employment, supply). Reviewing runs across the whole document.

3. Read the **findings**, organized into:
   - **Extracted clauses** — parties, effective date, term, renewal, termination, penalties, governing law, signature blocks. Each extraction has a **clickable citation** that highlights the exact source span in the document.
   - **Risk flags** — issues with a severity level (for example, an auto-renewal clause or an unusually long notice period).
   - **Missing-clause checklist** — what a contract of this type usually contains, marked found or missing. If the document is very long, CertiDZ shows a "partial analysis" banner rather than guessing.

   > 📸 **[Screenshot: AI findings panel listing extracted clauses with citation links, a red "High" risk flag, and a missing-clause checklist with green ticks and one red cross]**

4. Select any **citation** to jump to and highlight the source paragraph so you can confirm the AI read it correctly.

5. To dig deeper, use **Ask a question** — type something like *"When does this lease expire?"* The answer always includes at least one **page + paragraph citation**. If the assistant cannot find support, it replies *"I can't find this in the document"* rather than guessing.

6. Use the findings to guide **your** review. Nothing the AI produces is signed, sent, or applied to the document automatically — every action still needs your explicit click.

> **⚠️ Warning:** Every AI panel is labeled **"AI-generated — verify before use."** The AI never says a signature or contract is legally valid — legal validity comes only from the cryptographic verification portal (Walkthrough 4) and your own/legal counsel's judgement. Treat AI output as an assistive draft, not legal advice.

> **Tip:** Your prompts and the AI's outputs are logged and visible to your organization for audit. CertiDZ never uses your documents to train models for other tenants, and applies zero-retention at the model boundary.

---

## Walkthrough 10 — Manage team members

Invite people to your organization, give them the right role, and remove them when they leave. Least-privilege keeps your organization secure and audit-ready.

**Prerequisites**
- **Owner** or **Admin** role (both have `members:manage`). Compliance Officers, Managers, Members, and Auditors can view members but not change them.

**The six tenant roles**

| Role | What it can do (summary) |
|---|---|
| **Owner** | Everything, including organization-level settings and ownership transfer. |
| **Admin** | Everything except organization-level (`org:manage`) settings. |
| **Compliance Officer** | Read documents; read/void envelopes; issue/revoke certificates; run identity verification; read members; read the audit log. |
| **Manager** | Full documents; send/void envelopes; read certificates; run identity verification; read members. |
| **Member** | Read/write documents; read/send envelopes; read certificates. The everyday sender/signer role. |
| **Auditor** | Read-only everywhere (documents, envelopes, certificates, identity, members, billing, audit). Cannot change anything. |

**Steps**

1. Go to **Dashboard → Organization → Members** (or **Settings → Team**).

   > 📸 **[Screenshot: the Members list showing name, email, role dropdown, status, and an "Invite member" button top-right]**

2. Select **Invite member**. Enter the person's **email**, choose a **role** from the dropdown, and optionally add them to a **team**. Select **Send invitation**.

3. The invitee receives an email with a link to accept and set up their account (or sign in). Their status shows **Pending** until they accept.

4. To **change a role**, use the role dropdown next to a member and pick the new role. Changes take effect within about a minute across their sessions; a downgrade revokes elevated access on their next request.

   > 📸 **[Screenshot: role dropdown open next to a member showing Owner, Admin, Compliance Officer, Manager, Member, Auditor]**

5. To **remove** a member, select the **⋯** menu next to them → **Remove from organization**. You will be prompted to reassign or transfer their pending envelopes and templates.

> **Tip:** Grant the **least** role that lets someone do their job. Give external counsel a scoped **Guest** access instead of a full seat, and use **Auditor** for anyone who only needs to look, never change.

> **⚠️ Warning:** The **last Owner cannot be removed or downgraded** — you must first transfer ownership. Ownership transfer requires the new Owner to accept and to pass step-up authentication.

---

## Walkthrough 11 — Set up MFA and passkeys

Protect your account with multi-factor authentication and passkeys, and understand the extra "step-up" check CertiDZ asks for before signing.

**Prerequisites**
- Access to your CertiDZ account.
- For passkeys: a device/browser that supports WebAuthn (Chrome/Safari/Edge/Firefox current versions, Android ≥ 10, iOS ≥ 16). For TOTP: an authenticator app (Google Authenticator, Microsoft Authenticator, Aegis, etc.).

**Steps**

1. Go to **Settings → Security**.

   > 📸 **[Screenshot: Security settings page with cards for "Passkeys", "Authenticator app (TOTP)", and "Recovery codes"]**

2. **Add a passkey (recommended).** Select **Passkeys → Add passkey**. Follow your device prompt to authenticate with **fingerprint, Face ID, or a security key**. CertiDZ registers a discoverable (resident) passkey bound to `app.certidz.dz`. You can now sign in with just your biometric.

   > 📸 **[Screenshot: browser/OS passkey prompt "Use your fingerprint to create a passkey for app.certidz.dz"]**

3. **Add an authenticator app (TOTP).** Select **Authenticator app → Set up**, scan the **QR code** with your app (or enter the manual key), then type the **6-digit code** to confirm.

4. **Save your recovery codes.** When prompted, download or copy the **10 single-use recovery codes**. These let you get back in if you lose your phone and security key.

   > **⚠️ Warning:** Recovery codes are shown **only once** and cannot be retrieved later. Store them in a password manager or a safe place offline. If you lose every factor *and* your recovery codes, you must re-verify your identity (IDV) or wait out an admin-approved reset with a 24-hour delay.

5. **(If your organization enforces MFA)** you may be required to enroll at next login and cannot skip. Complete step 2 or 3 to continue.

6. **Understand step-up authentication.** When you sign an AdES or QES document — or run other sensitive actions — CertiDZ asks you to re-confirm with your passkey or a fresh code, even though you are already signed in. This "step-up" must be within the last 5 minutes and is what gives you **sole control** of your signing key. Absent step-up, signing is refused.

   > 📸 **[Screenshot: a step-up prompt during signing reading "Confirm it's you to sign — use your passkey"]**

> **Tip:** Passkeys are both easier and stronger than passwords, and the same passkey can serve as your signing step-up factor. If your tenant enforces passkey-only sign-in, register a passkey on more than one device so you always have a backup.

---

## Walkthrough 12 — Check the audit trail

Review the complete, tamper-evident history of an envelope, filter events, understand the hash-chain integrity guarantee, and export the trail for an auditor.

**Prerequisites**
- **Read** access to the envelope. Full-organization audit export requires the **Compliance Officer**, **Auditor**, **Admin**, or **Owner** role (they hold `audit:read`).

**Steps**

1. Open an envelope and select the **History** (or **Audit trail**) tab. For an organization-wide view, go to **Dashboard → Audit** / **Reports → Audit log**.

   > 📸 **[Screenshot: an envelope's Audit trail tab showing a chronological event list — Sent, Viewed, Authenticated, Signed, Completed — each with UTC timestamp, actor, and IP]**

2. Read the event timeline. Each entry records the **event type**, the **actor**, the **UTC timestamp**, the **IP address / device**, and the **authentication method** used.

3. **Filter** the trail to find what you need. Use the filter bar to narrow by **actor**, **event type**, **resource**, and **date range**. Filters combine with AND logic.

   > 📸 **[Screenshot: the audit filter bar with "Event type = Signed", "Actor = k.benali@…", and a date range applied]**

4. Understand the **integrity guarantee**. The audit log is **hash-chained**: every entry embeds the **SHA-256 hash of the previous entry**, so the records form an unbreakable chain. If anyone altered or deleted a past event, the chain would no longer compute — making tampering detectable. Signature events are retained for a minimum of **10 years**.

5. **Export** for an auditor. Select **Export → CSV** or **Export → JSON**. Large exports (up to 100k rows) generate asynchronously; you receive an expiring download link within a few minutes.

6. The export **includes the hash chain**. Give your auditor the accompanying verification endpoint/script (documented in the Verification & Trust help section) to independently re-validate chain integrity end-to-end.

   > 📸 **[Screenshot: the Export dialog with CSV and JSON options and a checkbox "Include hash chain for verification"]**

> **Tip:** The **Auditor** role is read-only everywhere — perfect for external or internal auditors who need to inspect and export but must never change data. Any attempt by an Auditor to modify something returns a 403 and is itself recorded in the audit log.

> **⚠️ Warning:** Do not treat a spreadsheet copy of the audit trail as proof on its own — its authority comes from the hash chain. Always keep the original JSON export (with the chain) so integrity can be re-verified later.

---

## Getting more help

- **Help Center:** select the **?** menu in the top bar of [app.certidz.dz](https://app.certidz.dz) to browse every section in Part 1.
- **In-app support:** **? → Contact support.** Include your envelope ID or correlation ID (shown on error pages) so support can trace your case — support staff can help without ever seeing your document content.
- **Verification portal:** [app.certidz.dz/verify](https://app.certidz.dz/verify) — always available, no account needed.
- **Status & uptime:** signing, verification, and the API target 99.9% monthly availability; the verification portal stays read-available even during incidents.

---

*CertiDZ by HISN — The trusted, AI-powered digital-trust platform for Algeria and Africa. Built for Law 15-04, in العربية, Français, and English.*
