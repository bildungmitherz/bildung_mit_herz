# Open Questions & Operational Items

This document tracks unresolved factual questions, pending organizational documents, and recommended decisions for the leadership of **Bildung mit Herz Sierra Leone e.V.**

---

## 1. Legal & Organizational Harmonization

### 1.1 Registered Name vs. Working Brand Name
- **Current Situation:**
  - Registered name in Vereinsregister: *Make them smile / Bildung mit Herz Sierra Leone e. V.* (VR 41272 B).
  - Public brand name: *Bildung mit Herz Sierra Leone e.V.*
  - Bank account holder at Sparkasse Berlin: *Make Them Smile e.V.*
- **Current Codebase Handling:** Transparently disclosed on the donation and about pages so donors understand why the recipient name on bank transfers shows *Make Them Smile e.V.*
- **Recommended Next Step:** Clarify whether a formal register amendment (*Satzungsänderung*) has been submitted to Amtsgericht Charlottenburg to harmonize the bank account and registered name entirely to *Bildung mit Herz Sierra Leone e.V.*

### 1.2 Tax-Exemption Notice (*Freistellungsbescheid*)
- **Current Situation:** The association operates as a recognized tax-exempt nonprofit (*gemeinnütziger Verein*).
- **Current Codebase Handling:** Standard legal disclaimer for donations up to €300 via bank statement (*vereinfachter Zuwendungsnachweis gemäß § 50 Abs. 4 EStDV*).
- **Recommended Next Step:** Record the exact date and tax office reference number (*Steuernummer / Finanzamt für Körperschaften I Berlin*) in `content/organization.json` once the latest *Freistellungsbescheid* is accessible.

---

## 2. Project Budgets & Contractor Estimates

### 2.1 Mamoru — Remaining Finishing Phase Budget
- **Current Situation:**
  - 5 classrooms constructed. 150 children in attendance.
  - Outstanding finishing work: security shutters, window glazing, interior chalkboards, exterior waterproofing, solar lighting.
  - Current estimated remaining need: **€15,000**.
- **Current Codebase Handling:** Marked explicitly as `"status": "estimated"` with note referencing local contractor estimates from Welfare Alert SL.
- **Recommended Next Step:** Obtain an updated itemized Bill of Quantities (BoQ) from Juliet Fornah / WA-SL for the 2026/2027 dry season to convert status to `"verified"`.

### 2.2 Madina — Structural Engineering Assessment
- **Current Situation:**
  - Initial wall construction paused in 2022 due to structural settling and foundation quality concerns.
  - Decision made for an honest engineering restart using a reinforced concrete frame.
  - Phase 1 (foundation & frame) estimated at **€18,000**; Phase 2 (finishing) estimated at **€22,000**.
- **Current Codebase Handling:** Transparently explained on project page as a commitment to safety and engineering integrity over rushing completion.
- **Recommended Next Step:** Formalize the structural engineer's site inspection notes and BoQ into a downloadable PDF for institutional donors.

### 2.3 Mafabaneh — Tchoban Voss Eco-School Construction Phasing
- **Current Situation:**
  - Architectural concept developed by Tchoban Voss Architekten with sustainable CSEB (Compressed Stabilized Earth Blocks) and passive ventilation.
  - Phase 1 budget estimated at **€45,000**; secured funding per reports stands at **€30,000**; outstanding need **€15,000**.
- **Current Codebase Handling:** Budget figures marked as estimated based on preliminary architectural estimates.
- **Recommended Next Step:** Align with Tchoban Voss Architekten on release schedule for construction execution drawings and verified tender documents.

---

## 3. Partner & Administrative Records

### 3.1 Welfare Alert Sierra Leone (WA-SL) Registration
- **Current Situation:**
  - Led by Juliet Jeneba Fornah in Makeni. Official profile PDF (`WelfareAlert.pdf`) is preserved and downloadable on the site.
- **Recommended Next Step:** Add WA-SL's official MoPED (Ministry of Planning and Economic Development) registration number to the partner profile.

### 3.2 Annual Financial Audit Reports
- **Current Situation:**
  - The association operates on an all-volunteer basis with 100% direct-to-project allocation (travel expenses paid privately).
- **Recommended Next Step:** Upload approved annual cash receipts and disbursement statements (*Einnahmen-Überschuss-Rechnung / Kassenprüfbericht*) for financial years 2024 and 2025 to `public/assets/documents/` once ratified by the general assembly.

---

## Summary of Fallback Handling in Website Release

| Area | Current Status in New Website | Fallback Strategy |
| :--- | :--- | :--- |
| **Bank Name** | Disclosed transparently on all donation touchpoints | Prevents bank transfer rejections while awaiting register updates |
| **Budgets** | Clearly marked as `"estimated"` with source notes | Protects institutional credibility; zero fabricated figures |
| **Madina History** | Honest account of structural pause & restart | Highlights engineering responsibility to corporate donors |
| **GDPR / Privacy** | 100% self-hosted, zero external third-party trackers | Eliminates legal risk under EU/German privacy law |
