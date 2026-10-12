# Content Editing Guide for Volunteers

This practical guide is designed for team members and volunteers of **Bildung mit Herz Sierra Leone e.V.** to update content, photos, project milestones, and financial numbers without needing advanced programming skills.

---

## 1. How Content is Organized

All website content is cleanly separated from code and stored as simple, human-readable JSON files in the `content/` folder:

```text
content/
├── organization.json        # Legal info, board members, contact details, bank data
├── navigation.json          # Main header & footer links (DE and EN)
├── transparency.json        # Financial allocation principles, accounting notes
├── corporate.json           # Sponsorship tiers for corporate & CSR partners
├── travel.json              # Educational travel dispatches, FAQs, itineraries
└── projects/
    ├── mafabaneh.json       # Mafabaneh Eco-School project data
    ├── mamoru.json          # Mamoru Primary School project data
    └── madina.json          # Madina Community School & structural restart
```

Every page updates automatically across both **German** and **English** routes whenever you re-run the build.

---

## 2. Updating Project Content & Financials

Each project in `content/projects/` contains bilingual text fields and structured financial objects.

### A. Editing Project Descriptions & Milestones

Open the relevant file (e.g., [content/projects/mamoru.json](file:///Users/mikio/Documents/CODING/bildung_mit_herz/content/projects/mamoru.json)):

```json
{
  "title": {
    "de": "Mamoru — Grundschule & Ausbau",
    "en": "Mamoru — Primary School & Finishing"
  },
  "summary": {
    "de": "5 Klassenräume für 150 Kinder errichtet...",
    "en": "5 classrooms constructed for 150 children..."
  }
}
```

To add or update a milestone in the project timeline:

```json
{
  "year": "2026",
  "title": {
    "de": "Dachversiegelung und Fensterinstallation",
    "en": "Roof sealing and window installation"
  },
  "description": {
    "de": "Abschluss der wetterfesten Gebäudehülle vor der Regenzeit.",
    "en": "Completion of weatherproof building envelope before rainy season."
  },
  "completed": true
}
```

### B. Updating Budgets & Financial Figures

Transparency is paramount. Never enter fabricated or guessed numbers without marking their status:

```json
"financials": {
  "totalBudgetEur": 45000,
  "securedFundingEur": 30000,
  "outstandingNeedEur": 15000,
  "status": "estimated",          // Use "estimated" or "verified"
  "budgetSourceNote": "Architekten-Kostenschätzung Tchoban Voss 2024 / WA-SL",
  "securedSourceNote": "Spendenstand Sparkasse Berlin per Oktober 2026",
  "costBreakdown": [
    {
      "item": {
        "de": "Rohbau & Erdpresssteine (CSEB)",
        "en": "Shell construction & CSEB blocks"
      },
      "amountEur": 22000,
      "status": "verified"
    }
  ]
}
```

> **Important Rule:** Ensure `securedFundingEur + outstandingNeedEur = totalBudgetEur`. The automated test suite (`npm test`) verifies this equation automatically.

---

## 3. Adding New Photographs

All images are stored in `public/assets/images/`.

### Guidelines for Images

1. **File format:** JPEG (`.jpg`), PNG (`.png`), or WebP (`.webp`).
2. **File size:** Optimize images to remain under **500 KB** (maximum 1 MB) to ensure fast loading on mobile networks.
3. **Naming convention:** Use lowercase letters and hyphens (e.g., `mamoru-classroom-interior.jpg`). Avoid spaces, umlauts, or special characters.
4. **Authenticity:** Only use authentic field photography from project sites in Sierra Leone. Never use stock photos or staged charity tropes.

### Linking Photos in Content

Once copied into `public/assets/images/`, reference the photo in the relevant project JSON:

```json
"gallery": [
  {
    "src": "/assets/images/mamoru-classroom-interior.jpg",
    "alt": {
      "de": "Unterricht im neuen Klassenzimmer der Mamoru Grundschule",
      "en": "Teaching inside the new classroom at Mamoru Primary School"
    },
    "caption": {
      "de": "Erster Unterrichtstag in den neu verputzten Räumen (2025).",
      "en": "First day of classes in the newly rendered classrooms (2025)."
    }
  }
]
```

---

## 4. Updating Organizational & Banking Information

All official organizational details are centralized in [content/organization.json](file:///Users/mikio/Documents/CODING/bildung_mit_herz/content/organization.json):

- **Bank Account / Spendenkonto:**
  - `accountHolder`: "Make Them Smile e.V." (matches official Sparkasse Berlin account holder).
  - `iban`: "DE55 1005 0000 0191 5729 00"
  - `bic`: "BELADEBEXXX"
- **Register Information:**
  - `registerCourt`: "Amtsgericht Charlottenburg (Berlin)"
  - `registrationNumber`: "VR 41272 B"
- **Board of Directors (Vorstand):**
  - Add or update board member roles and names in the `"board"` array.

---

## 5. Adding Corporate Partnership Packages

In [content/corporate.json](file:///Users/mikio/Documents/CODING/bildung_mit_herz/content/corporate.json), you can modify the sponsorship tiers for companies (e.g., Impulsgeber, Baustein, Zukunftspartner) and their respective CSR/ESG benefits.

---

## 6. Testing Your Changes Locally

Before sharing or publishing changes, test them locally on your computer:

1. **Open your terminal** and navigate to the project directory:
   ```bash
   cd bildung_mit_herz
   ```
2. **Start the local preview:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your web browser. Any changes to `content/` will instantly rebuild the site.
3. **Run the automated quality check:**
   ```bash
   npm test
   ```
   This will verify:
   - That all internal links point to valid pages.
   - That all image files exist and have descriptive alt text.
   - That your financial numbers calculate accurately.
   - That HTML structure and bank details remain valid.

---

## 7. Publishing to Production

Once you are satisfied with your changes and `npm test` passes:

```bash
git add content/ public/assets/images/
git commit -m "Update Mamoru project photos and budget figures"
git push origin main
```

Cloudflare Pages will automatically detect the commit, run `npm run build`, and deploy the updated website to production within 60 seconds.
