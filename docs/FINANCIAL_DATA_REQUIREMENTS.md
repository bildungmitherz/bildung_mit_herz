# Financial Data Requirements & Transparency Model

**Datum:** 12. Oktober 2026  
**Organisation:** Bildung mit Herz Sierra Leone e.V. (Make Them Smile e.V.)  

---

## 1. Grundsätze des Finanzdatenmodells

Um gegenüber Unternehmen, Stiftungen und Großspendern uneingeschränkt glaubwürdig zu sein, folgt das Finanzdatenmodell strikten buhalterischen und ethischen Grundsätzen:

1. **Keine erfundenen Zahlen:** Fehlende Werte werden explizit als „in Abstimmung“ oder „nicht verifiziert“ ausgewiesen – niemals durch Schätzwerte vorgetäuscht.
2. **Kategoriale Trennung:** Folgende Dimensionen dürfen niemals vermischt oder saldiert werden:
   - **Geschätzte Gesamtkosten (Estimated Total Cost):** Vorläufige Baukostenschätzung.
   - **Bewilligtes Budget (Approved Budget):** Vom Vereinsvorstand formell freigegebener Finanzierungsrahmen.
   - **Zugesagte Mittel (Pledged Funding):** Verbindliche Spendenzusagen, noch nicht auf dem Konto eingegangen.
   - **Eingegangene Spenden (Received Donations):** Tatsächlich auf dem Vereinskonto gutgeschriebene Gelder.
   - **Ausgezahlte Mittel (Expenses Paid):** In Tranchen gegen Baufortschrittsbeleg an Partner vor Ort überwiesene Beträge.
   - **Offener Finanzierungsbedarf (Outstanding Need):** Berechnete Differenz zwischen Budget und gesicherten Mitteln.
3. **Beleg- und Quellennachweis:** Zu jedem Finanzbetrag wird eine Quelle (z.B. KV, Überweisungsbeleg, Partnerabrechnung) mit Datum erfasst.

---

## 2. Strukturierte Daten-Spezifikation (TypeScript Schema)

```typescript
export type VerificationStatus = "verified" | "estimated" | "unverified";

export interface MonetaryAmount {
  amount: number | null;
  currency: "EUR" | "SLE" | "USD";
  status: VerificationStatus;
  asOfDate: string;
  sourceNote?: string;
  documentRef?: string;
}

export interface ProjectFinances {
  projectId: "mamoru" | "mafabaneh" | "madina";
  estimatedTotalCost: MonetaryAmount;
  approvedBudget: MonetaryAmount;
  donationsReceived: MonetaryAmount;
  fundingCommitted: MonetaryAmount;
  expensesPaid: MonetaryAmount;
  outstandingFundingNeed: MonetaryAmount;
  costBreakdown?: {
    category: string;
    amount: number;
    currency: "EUR" | "SLE" | "USD";
    status: VerificationStatus;
    note: string;
  }[];
  fundingPhases?: {
    phaseId: string;
    title: string;
    targetAmount: number;
    fundedAmount: number;
    status: "funded" | "active" | "planned";
    description: string;
  }[];
}
```

---

## 3. Ist-Stand der verifizierten Finanzdaten (Stand: Oktober 2026)

### Projekt Mamoru
- **Verifizierte Fakten:**
  - Bauphase 1 (Mauerwerk, Dach, 5 Klassenräume): Vollständig abgeschlossen (2025).
  - Möblierung (Schulbänke & Tische): Durch *AcadeMedia Education GmbH* finanziert und umgesetzt.
  - Lehrergehälter: Gehälter von 5 Lehrkräften für 12 Monate durch *AcadeMedia Education GmbH* im Voraus abgesichert.
- **Offene Bedarfe (in Abstimmung):**
  - Innen- und Außenverputz der fünf Klassenräume.
  - Zementestrich / Bodenbeläge.
  - Sichere Holztüren und Fensterläden.
  - Schätzwert für Abschlussarbeiten: ca. 4.500 € bis 6.000 € (KVA der lokalen Handwerker steht zur finalen Vorstandsprüfung an).

### Projekt Mafabaneh („Kaprr Yoni Global Learning Hub“)
- **Verifizierte Fakten:**
  - 2.000 handgefertigte Lehmziegel durch die Dorfgemeinschaft vor Ort gefertigt.
  - Grundsteinlegung im Frühjahr 2026 durchgeführt.
  - Architekturentwurf ehrenamtlich durch Tchoban Voss Architekten erbracht.
  - Zwei Architekten aus dem Büro Tchoban Voss reisen im Frühjahr/Sommer 2026 zur Baubegleitung nach Sierra Leone.
- **Finanzierungsstruktur:**
  - Auszahlung der Baukosten erfolgt in transparenten Baufortschritts-Tranchen an den Partnerverein *Kaprr Yoni Global Learning Hub*.
  - Gesamtbudget in der Finalisierung nach statischer Detaillierung.

### Projekt Madina
- **Verifizierte Fakten:**
  - Ursprünglicher Zuschuss: ca. 200 USD (in 2025 übergeben).
  - Tragischer Einsturz des unbewehrten Baus durch Starkregen; Neukonzeption als Stahlbetonskelettbau.
  - Phase 1: 6 Klassenräume + 1 Lehrerzimmer.
  - Geplante Anschlussphasen: Eigener Trinkwasserbrunnen, Sanitärtrakt, befestigter Schulhof.
- **Finanzierungsbedarf:**
  - Tragwerksplanung und Materialkostenangebot für Stahlbeton und Zement werden aktuell eingeholt.

---

## 4. Konkrete Anforderungen & Ansprechpartner für die Datenvervollständigung

| Benötigte Information | Zweck | Zuständigkeit |
|---|---|---|
| Kostenvoranschlag Verputz & Türen Mamoru | Veröffentlichung als konkreter Spendenbaustein | Juliet Fornah (WA-SL) / Philipp Herzberg |
| Detaillierte Kostenschätzung Bauabschnitte Mafabaneh | Bereitstellung für Unternehmenssponsoren | Architektenteam / Yoni Sesay |
| Leistungsverzeichnis Stahlbeton Madina | Exakte Bedarfsberechnung Phase 1 | Bauingenieur-Team der Bildungsreise |
| Jahresspenden-Gesamtsumme 2025 | Veröffentlichung im Transparenzbericht | Kassenwart / Vorstand Make Them Smile e.V. |
