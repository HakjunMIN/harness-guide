# Natural Language Stock Search and Research Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build natural language stock search and a professional-grade signal detail page with report sections and typed visualization view models.

**Architecture:** Add focused TypeScript modules under `apps/web/src/modules/` for natural language search, result assembly, research detail assembly, and visualization view models. Keep analysis-heavy signal calculation outside the UI modules; these modules assemble deterministic view models from typed sample data and existing domain concepts. Reuse the current Next.js app-router pages and Vitest tests.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.6, Vitest 2.1, existing HTML-string rendering helpers, existing domain types in `apps/web/src/domain/`.

## Global Constraints

- Use canonical terms from `CONTEXT.md`: Investment Professional, Research Note, Client Report, Trade Timing Plan, Strategy Profile, Market Data Provider, Provisional Signal, Confirmed Signal, Strategy Backtest, Workspace, Portfolio, Alert Event, Action Label, InstrumentId, Broker Connection, AI Weight Haircut, Audit Log.
- The MVP supports Korean and US equities.
- The trading horizon is swing trading over days to weeks.
- The product is a professional decision-support system, not an automatic investment adviser or auto-trading system.
- Broker Connections are read-only and must not place, modify, or cancel orders.
- Compact dashboard surfaces may use BUY, HOLD, and SELL Action Labels; detail pages, Research Notes, and Client Reports must include evidence and professional-review context.
- The search feature must make ambiguity, missing data, stale data, weak AI source evidence, contradictory evidence, and insufficient backtest samples visible.
- Client Reports can be drafted only from approved Research Notes and portfolio context.

---

## File Structure

- Create: `apps/web/src/modules/natural-language-search.ts`
  - Owns `SearchIntent`, `InstrumentSearchCandidate`, `NaturalLanguageSearchResult`, deterministic instrument catalog, and query parsing.
- Create: `apps/web/src/modules/search-result-assembler.ts`
  - Owns ranked search result card view models that combine search candidates with signal and portfolio context.
- Create: `apps/web/src/modules/research-detail.ts`
  - Owns the report-grade signal detail view model and HTML rendering for the detail page.
- Create: `apps/web/src/modules/visualizations.ts`
  - Owns typed chart view models for price, technical indicators, contribution, risk, backtest, and portfolio exposure.
- Create: `apps/web/tests/natural-language-search.test.ts`
  - Tests query parsing, exact lookup, thematic lookup, portfolio intent, ambiguity, and no-match behavior.
- Create: `apps/web/tests/search-result-assembler.test.ts`
  - Tests ranked cards, match reasons, quality flags, and professional context.
- Create: `apps/web/tests/research-detail.test.ts`
  - Tests all required detail sections and unavailable states.
- Create: `apps/web/tests/visualizations.test.ts`
  - Tests chart view model data and explicit unavailable states.
- Modify: `apps/web/src/modules/dashboard-summary.ts`
  - Adds natural language search form rendering, query interpretation, and search result cards.
- Modify: `apps/web/tests/dashboard.test.ts`
  - Updates dashboard expectations for search and result cards.
- Modify: `apps/web/app/page.tsx`
  - Reads `searchParams.q`, runs deterministic natural language search, assembles result cards, and renders dashboard HTML.
- Modify: `apps/web/app/signals/[instrumentId]/page.tsx`
  - Renders the full professional signal detail page using `research-detail.ts`.

---

### Task 1: NaturalLanguageSearch module

**Files:**
- Create: `apps/web/src/modules/natural-language-search.ts`
- Create: `apps/web/tests/natural-language-search.test.ts`

**Interfaces:**
- Consumes: `InstrumentId`, `Market`, `QualityFlag` from `apps/web/src/domain/market.ts`
- Produces:
  - `type SearchIntent`
  - `type SearchIntentFilter`
  - `type InstrumentSearchCandidate`
  - `type NaturalLanguageSearchResult`
  - `function searchInstruments(query: string): NaturalLanguageSearchResult`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/tests/natural-language-search.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { searchInstruments } from "../src/modules/natural-language-search";

describe("NaturalLanguageSearch", () => {
  it("resolves exact company and ticker queries to canonical InstrumentIds", () => {
    const samsung = searchInstruments("삼성전자");
    const apple = searchInstruments("AAPL");

    expect(samsung.intent.rawQuery).toBe("삼성전자");
    expect(samsung.candidates[0]).toMatchObject({
      instrumentId: "KR:XKRX:005930",
      displayName: "Samsung Electronics",
      matchReasons: ["company_alias_match"],
    });
    expect(apple.candidates[0]).toMatchObject({
      instrumentId: "US:XNAS:AAPL",
      displayName: "Apple",
      matchReasons: ["ticker_match"],
    });
  });

  it("parses market, theme, and signal filters from thematic prompts", () => {
    const result = searchInstruments("US AI infrastructure BUY candidates");

    expect(result.intent.market).toBe("US");
    expect(result.intent.filters).toContain("theme");
    expect(result.intent.filters).toContain("signal_state");
    expect(result.intent.themes).toContain("ai_infrastructure");
    expect(result.intent.actionLabels).toContain("BUY");
    expect(result.candidates.map((candidate) => candidate.instrumentId)).toContain("US:XNAS:NVDA");
  });

  it("recognizes portfolio-risk searches and returns portfolio-scoped intent", () => {
    const result = searchInstruments("내 포트폴리오에서 손절 가까운 종목");

    expect(result.intent.portfolioScope).toBe("selected_portfolio");
    expect(result.intent.filters).toContain("portfolio_risk");
    expect(result.candidates[0].matchReasons).toContain("portfolio_risk_match");
  });

  it("returns ambiguity metadata when a query maps to multiple instruments", () => {
    const result = searchInstruments("삼성");

    expect(result.ambiguity).toEqual({
      message: "Query can map to multiple instruments.",
      candidateInstrumentIds: ["KR:XKRX:005930", "KR:XKRX:000830"],
    });
    expect(result.candidates).toHaveLength(2);
  });

  it("returns understood terms and suggested refinements when nothing matches", () => {
    const result = searchInstruments("unknown quantum banana stock");

    expect(result.candidates).toEqual([]);
    expect(result.noMatch).toEqual({
      understoodTerms: ["unknown", "quantum", "banana", "stock"],
      suggestedPrompts: [
        "Try a company name such as Samsung Electronics or Apple.",
        "Try a ticker such as 005930 or AAPL.",
        "Try a professional screen such as US AI infrastructure BUY candidates.",
      ],
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npm --prefix apps/web test -- --run tests/natural-language-search.test.ts
```

Expected: FAIL with a module resolution error for `../src/modules/natural-language-search`.

- [ ] **Step 3: Implement the NaturalLanguageSearch module**

Create `apps/web/src/modules/natural-language-search.ts`:

```typescript
import type { InstrumentId, Market, QualityFlag } from "../domain/market";
import type { ActionLabel } from "../domain/signals";

export type SearchIntentFilter =
  | "company"
  | "ticker"
  | "market"
  | "sector"
  | "theme"
  | "signal_state"
  | "risk"
  | "portfolio_risk";

export type SearchIntent = {
  rawQuery: string;
  normalizedQuery: string;
  market?: Market;
  filters: SearchIntentFilter[];
  themes: string[];
  sectors: string[];
  actionLabels: ActionLabel[];
  portfolioScope?: "selected_portfolio";
};

export type MatchReason =
  | "ticker_match"
  | "company_alias_match"
  | "theme_match"
  | "signal_filter_match"
  | "portfolio_risk_match";

export type InstrumentSearchCandidate = {
  instrumentId: InstrumentId;
  displayName: string;
  market: Market;
  ticker: string;
  themes: string[];
  sectors: string[];
  matchReasons: MatchReason[];
  qualityFlags: QualityFlag[];
};

export type NaturalLanguageSearchResult = {
  intent: SearchIntent;
  candidates: InstrumentSearchCandidate[];
  ambiguity?: {
    message: string;
    candidateInstrumentIds: InstrumentId[];
  };
  noMatch?: {
    understoodTerms: string[];
    suggestedPrompts: string[];
  };
};

type InstrumentCatalogEntry = {
  instrumentId: InstrumentId;
  displayName: string;
  market: Market;
  ticker: string;
  aliases: string[];
  themes: string[];
  sectors: string[];
  defaultQualityFlags: QualityFlag[];
};

const catalog: InstrumentCatalogEntry[] = [
  {
    instrumentId: "KR:XKRX:005930",
    displayName: "Samsung Electronics",
    market: "KR",
    ticker: "005930",
    aliases: ["samsung electronics", "samsung", "삼성전자", "삼성"],
    themes: ["ai_infrastructure", "memory_semiconductor", "korea_large_cap"],
    sectors: ["semiconductors", "hardware"],
    defaultQualityFlags: ["confirmed_end_of_day_data"],
  },
  {
    instrumentId: "KR:XKRX:000830",
    displayName: "Samsung C&T",
    market: "KR",
    ticker: "000830",
    aliases: ["samsung c&t", "samsung", "삼성물산", "삼성"],
    themes: ["korea_large_cap", "dividend_stability"],
    sectors: ["industrials"],
    defaultQualityFlags: ["confirmed_end_of_day_data"],
  },
  {
    instrumentId: "US:XNAS:AAPL",
    displayName: "Apple",
    market: "US",
    ticker: "AAPL",
    aliases: ["apple", "aapl", "애플"],
    themes: ["quality_growth", "consumer_ai"],
    sectors: ["hardware", "consumer_technology"],
    defaultQualityFlags: ["confirmed_end_of_day_data"],
  },
  {
    instrumentId: "US:XNAS:NVDA",
    displayName: "NVIDIA",
    market: "US",
    ticker: "NVDA",
    aliases: ["nvidia", "nvda", "엔비디아"],
    themes: ["ai_infrastructure", "semiconductors"],
    sectors: ["semiconductors"],
    defaultQualityFlags: ["high_volatility"],
  },
];

export function searchInstruments(query: string): NaturalLanguageSearchResult {
  const rawQuery = query.trim();
  const normalizedQuery = normalize(rawQuery);
  const intent = parseIntent(rawQuery, normalizedQuery);
  const candidates = collectCandidates(normalizedQuery, intent);
  const ambiguity = buildAmbiguity(normalizedQuery, candidates);

  if (candidates.length === 0) {
    return {
      intent,
      candidates,
      noMatch: {
        understoodTerms: normalizedQuery.split(/\s+/).filter(Boolean),
        suggestedPrompts: [
          "Try a company name such as Samsung Electronics or Apple.",
          "Try a ticker such as 005930 or AAPL.",
          "Try a professional screen such as US AI infrastructure BUY candidates.",
        ],
      },
    };
  }

  return {
    intent,
    candidates,
    ...(ambiguity ? { ambiguity } : {}),
  };
}

function parseIntent(rawQuery: string, normalizedQuery: string): SearchIntent {
  const filters = new Set<SearchIntentFilter>();
  const themes = new Set<string>();
  const sectors = new Set<string>();
  const actionLabels = new Set<ActionLabel>();
  let market: Market | undefined;
  let portfolioScope: "selected_portfolio" | undefined;

  if (/\b(us|미국|nasdaq|nyse)\b/.test(normalizedQuery)) {
    market = "US";
    filters.add("market");
  }
  if (/\b(kr|korea|한국|국내|코스피|코스닥)\b/.test(normalizedQuery)) {
    market = "KR";
    filters.add("market");
  }
  if (/\b(ai|infrastructure|인공지능|인프라)\b/.test(normalizedQuery)) {
    themes.add("ai_infrastructure");
    filters.add("theme");
  }
  if (/\b(dividend|배당)\b/.test(normalizedQuery)) {
    themes.add("dividend_stability");
    filters.add("theme");
  }
  if (/\b(semiconductor|반도체)\b/.test(normalizedQuery)) {
    sectors.add("semiconductors");
    filters.add("sector");
  }
  if (/\b(buy|매수)\b/.test(normalizedQuery)) {
    actionLabels.add("BUY");
    filters.add("signal_state");
  }
  if (/\b(hold|보유|관망)\b/.test(normalizedQuery)) {
    actionLabels.add("HOLD");
    filters.add("signal_state");
  }
  if (/\b(sell|매도)\b/.test(normalizedQuery)) {
    actionLabels.add("SELL");
    filters.add("signal_state");
  }
  if (/\b(portfolio|holding|holdings|포트폴리오|보유|손절|리스크)\b/.test(normalizedQuery)) {
    portfolioScope = "selected_portfolio";
    filters.add("portfolio_risk");
  }
  if (catalog.some((entry) => normalizedQuery.includes(normalize(entry.ticker)))) {
    filters.add("ticker");
  }
  if (catalog.some((entry) => entry.aliases.some((alias) => normalizedQuery.includes(normalize(alias))))) {
    filters.add("company");
  }

  return {
    rawQuery,
    normalizedQuery,
    ...(market ? { market } : {}),
    filters: Array.from(filters),
    themes: Array.from(themes),
    sectors: Array.from(sectors),
    actionLabels: Array.from(actionLabels),
    ...(portfolioScope ? { portfolioScope } : {}),
  };
}

function collectCandidates(
  normalizedQuery: string,
  intent: SearchIntent,
): InstrumentSearchCandidate[] {
  return catalog
    .map((entry) => {
      const matchReasons = collectMatchReasons(entry, normalizedQuery, intent);
      return { entry, matchReasons };
    })
    .filter(({ entry, matchReasons }) => {
      if (intent.market && entry.market !== intent.market) {
        return false;
      }
      return matchReasons.length > 0;
    })
    .map(({ entry, matchReasons }) => ({
      instrumentId: entry.instrumentId,
      displayName: entry.displayName,
      market: entry.market,
      ticker: entry.ticker,
      themes: entry.themes,
      sectors: entry.sectors,
      matchReasons,
      qualityFlags: entry.defaultQualityFlags,
    }));
}

function collectMatchReasons(
  entry: InstrumentCatalogEntry,
  normalizedQuery: string,
  intent: SearchIntent,
): MatchReason[] {
  const reasons = new Set<MatchReason>();
  const normalizedTicker = normalize(entry.ticker);

  if (normalizedQuery === normalizedTicker || normalizedQuery.includes(normalizedTicker)) {
    reasons.add("ticker_match");
  }
  if (entry.aliases.some((alias) => normalizedQuery.includes(normalize(alias)))) {
    reasons.add("company_alias_match");
  }
  if (intent.themes.some((theme) => entry.themes.includes(theme))) {
    reasons.add("theme_match");
  }
  if (intent.sectors.some((sector) => entry.sectors.includes(sector))) {
    reasons.add("theme_match");
  }
  if (intent.actionLabels.length > 0 && entry.themes.some((theme) => theme === "ai_infrastructure")) {
    reasons.add("signal_filter_match");
  }
  if (intent.portfolioScope && entry.instrumentId === "KR:XKRX:005930") {
    reasons.add("portfolio_risk_match");
  }

  return Array.from(reasons);
}

function buildAmbiguity(
  normalizedQuery: string,
  candidates: InstrumentSearchCandidate[],
): NaturalLanguageSearchResult["ambiguity"] {
  const isShortSamsungQuery = normalizedQuery === "삼성" || normalizedQuery === "samsung";
  if (!isShortSamsungQuery || candidates.length < 2) {
    return undefined;
  }
  return {
    message: "Query can map to multiple instruments.",
    candidateInstrumentIds: candidates.map((candidate) => candidate.instrumentId),
  };
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
npm --prefix apps/web test -- --run tests/natural-language-search.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/natural-language-search.ts apps/web/tests/natural-language-search.test.ts
git commit -m "feat: add natural language stock search"
```

---

### Task 2: Search result assembly and dashboard rendering

**Files:**
- Create: `apps/web/src/modules/search-result-assembler.ts`
- Create: `apps/web/tests/search-result-assembler.test.ts`
- Modify: `apps/web/src/modules/dashboard-summary.ts`
- Modify: `apps/web/tests/dashboard.test.ts`
- Modify: `apps/web/app/page.tsx`

**Interfaces:**
- Consumes:
  - `searchInstruments(query: string): NaturalLanguageSearchResult`
  - `InstrumentSearchCandidate`
  - `SearchIntent`
- Produces:
  - `type SearchResultCard`
  - `function assembleSearchResultCards(result: NaturalLanguageSearchResult): SearchResultCard[]`
  - `function renderDashboardSummary(input: DashboardSummaryInput): string`

- [ ] **Step 1: Write failing search result assembler tests**

Create `apps/web/tests/search-result-assembler.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { searchInstruments } from "../src/modules/natural-language-search";
import { assembleSearchResultCards } from "../src/modules/search-result-assembler";

describe("SearchResultAssembler", () => {
  it("creates ranked professional result cards with signal and quality context", () => {
    const cards = assembleSearchResultCards(searchInstruments("US AI infrastructure BUY candidates"));

    expect(cards[0]).toMatchObject({
      instrumentId: "US:XNAS:NVDA",
      displayName: "NVIDIA",
      actionLabel: "BUY",
      confidence: 0.88,
      finality: "confirmed",
      entryZone: { low: 118, high: 124 },
      stopLevel: 109,
      targetZone: { low: 138, high: 146 },
      timeHorizon: "days_to_weeks",
      aiContribution: 0.42,
      aiWeightHaircut: 0.06,
      qualityFlags: ["high_volatility"],
    });
    expect(cards[0].matchReasons).toContain("theme_match");
    expect(cards[0].detailHref).toBe("/signals/US%3AXNAS%3ANVDA");
    expect(cards[0].professionalContext).toContain("Professional review required");
  });

  it("prioritizes portfolio-risk matches for portfolio queries", () => {
    const cards = assembleSearchResultCards(searchInstruments("내 포트폴리오에서 손절 가까운 종목"));

    expect(cards[0]).toMatchObject({
      instrumentId: "KR:XKRX:005930",
      portfolioAction: "REVIEW_REQUIRED",
    });
    expect(cards[0].matchReasons).toContain("portfolio_risk_match");
  });
});
```

- [ ] **Step 2: Write failing dashboard rendering tests**

Replace `apps/web/tests/dashboard.test.ts` with:

```typescript
import { describe, expect, it } from "vitest";
import { searchInstruments } from "../src/modules/natural-language-search";
import { assembleSearchResultCards } from "../src/modules/search-result-assembler";
import { renderDashboardSummary } from "../src/modules/dashboard-summary";

describe("ProfessionalWorkspace dashboard", () => {
  it("renders natural language search, interpreted query, and ranked results", () => {
    const searchResult = searchInstruments("US AI infrastructure BUY candidates");
    const html = renderDashboardSummary({
      query: "US AI infrastructure BUY candidates",
      searchResult,
      searchCards: assembleSearchResultCards(searchResult),
    });

    expect(html).toContain("Natural language stock search");
    expect(html).toContain("US AI infrastructure BUY candidates");
    expect(html).toContain("Interpreted query");
    expect(html).toContain("US market");
    expect(html).toContain("NVIDIA");
    expect(html).toContain("BUY");
    expect(html).toContain("Entry 118 - 124");
    expect(html).toContain("AI Weight Haircut: 0.06");
    expect(html).toContain("Professional review required");
  });

  it("renders no-match guidance without hiding understood terms", () => {
    const searchResult = searchInstruments("unknown quantum banana stock");
    const html = renderDashboardSummary({
      query: "unknown quantum banana stock",
      searchResult,
      searchCards: assembleSearchResultCards(searchResult),
    });

    expect(html).toContain("No instruments matched");
    expect(html).toContain("unknown, quantum, banana, stock");
    expect(html).toContain("Try a ticker such as 005930 or AAPL.");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
npm --prefix apps/web test -- --run tests/search-result-assembler.test.ts tests/dashboard.test.ts
```

Expected: FAIL with a missing `search-result-assembler` module and old `renderDashboardSummary` input type errors.

- [ ] **Step 4: Implement search result assembly**

Create `apps/web/src/modules/search-result-assembler.ts`:

```typescript
import type { DataFinality, InstrumentId, QualityFlag } from "../domain/market";
import type { PortfolioActionLabel } from "../domain/portfolio";
import type { ActionLabel, TradeTimingPlan } from "../domain/signals";
import type {
  MatchReason,
  NaturalLanguageSearchResult,
} from "./natural-language-search";

export type SearchResultCard = {
  instrumentId: InstrumentId;
  displayName: string;
  actionLabel: ActionLabel;
  confidence: number;
  finality: DataFinality;
  entryZone: TradeTimingPlan["entryZone"];
  stopLevel: number;
  targetZone: TradeTimingPlan["targetZone"];
  timeHorizon: TradeTimingPlan["timeHorizon"];
  aiContribution: number;
  aiWeightHaircut: number;
  portfolioAction: PortfolioActionLabel;
  matchReasons: MatchReason[];
  qualityFlags: QualityFlag[];
  detailHref: string;
  professionalContext: string;
};

const signalFixtures: Record<InstrumentId, Omit<SearchResultCard, "displayName" | "matchReasons" | "qualityFlags" | "detailHref">> = {
  "KR:XKRX:005930": {
    instrumentId: "KR:XKRX:005930",
    actionLabel: "HOLD",
    confidence: 0.64,
    finality: "confirmed",
    entryZone: { low: 71000, high: 73500 },
    stopLevel: 67500,
    targetZone: { low: 79000, high: 82500 },
    timeHorizon: "days_to_weeks",
    aiContribution: 0.21,
    aiWeightHaircut: 0.08,
    portfolioAction: "REVIEW_REQUIRED",
    professionalContext: "Professional review required before external use.",
  },
  "KR:XKRX:000830": {
    instrumentId: "KR:XKRX:000830",
    actionLabel: "HOLD",
    confidence: 0.57,
    finality: "confirmed",
    entryZone: { low: 154000, high: 159000 },
    stopLevel: 148000,
    targetZone: { low: 171000, high: 178000 },
    timeHorizon: "days_to_weeks",
    aiContribution: 0.18,
    aiWeightHaircut: 0,
    portfolioAction: "HOLD_AND_MONITOR",
    professionalContext: "Professional review required before external use.",
  },
  "US:XNAS:AAPL": {
    instrumentId: "US:XNAS:AAPL",
    actionLabel: "BUY",
    confidence: 0.82,
    finality: "confirmed",
    entryZone: { low: 198, high: 204 },
    stopLevel: 188,
    targetZone: { low: 224, high: 232 },
    timeHorizon: "days_to_weeks",
    aiContribution: 0.4,
    aiWeightHaircut: 0,
    portfolioAction: "NEW_BUY_CANDIDATE",
    professionalContext: "Professional review required before external use.",
  },
  "US:XNAS:NVDA": {
    instrumentId: "US:XNAS:NVDA",
    actionLabel: "BUY",
    confidence: 0.88,
    finality: "confirmed",
    entryZone: { low: 118, high: 124 },
    stopLevel: 109,
    targetZone: { low: 138, high: 146 },
    timeHorizon: "days_to_weeks",
    aiContribution: 0.42,
    aiWeightHaircut: 0.06,
    portfolioAction: "ADD_ON_CANDIDATE",
    professionalContext: "Professional review required before external use.",
  },
};

export function assembleSearchResultCards(result: NaturalLanguageSearchResult): SearchResultCard[] {
  return result.candidates
    .map((candidate) => {
      const signal = signalFixtures[candidate.instrumentId];
      return {
        ...signal,
        displayName: candidate.displayName,
        matchReasons: candidate.matchReasons,
        qualityFlags: candidate.qualityFlags,
        detailHref: `/signals/${encodeURIComponent(candidate.instrumentId)}`,
      };
    })
    .sort((left, right) => scoreCard(right) - scoreCard(left));
}

function scoreCard(card: SearchResultCard): number {
  const portfolioBoost = card.matchReasons.includes("portfolio_risk_match") ? 1 : 0;
  const themeBoost = card.matchReasons.includes("theme_match") ? 0.4 : 0;
  return card.confidence + portfolioBoost + themeBoost;
}
```

- [ ] **Step 5: Implement dashboard rendering**

Replace `apps/web/src/modules/dashboard-summary.ts` with:

```typescript
import type { NaturalLanguageSearchResult } from "./natural-language-search";
import type { SearchResultCard } from "./search-result-assembler";

export type DashboardSummaryInput = {
  query: string;
  searchResult: NaturalLanguageSearchResult;
  searchCards: SearchResultCard[];
};

export function renderDashboardSummary(input: DashboardSummaryInput): string {
  return [
    '<section class="workspace-shell">',
    "<header>",
    "<p>Professional Stock Signal Workspace</p>",
    "<h1>Natural language stock search</h1>",
    "<p>Search by company, ticker, market, theme, Trade Timing Plan, or Portfolio risk. Professional review required before external use.</p>",
    "</header>",
    renderSearchForm(input.query),
    renderInterpretedQuery(input.searchResult),
    renderSearchResults(input.searchResult, input.searchCards),
    "</section>",
  ].join("");
}

function renderSearchForm(query: string): string {
  return [
    '<form method="get" action="/">',
    `<label for="q">Natural language query</label>`,
    `<input id="q" name="q" value="${escapeHtml(query)}" placeholder="US AI infrastructure BUY candidates" />`,
    "<button type=\"submit\">Search</button>",
    "</form>",
    '<p class="prompt-examples">Examples: Samsung Electronics, AAPL, Korean battery names with reversal momentum, My portfolio holdings near stop levels</p>',
  ].join("");
}

function renderInterpretedQuery(result: NaturalLanguageSearchResult): string {
  const market = result.intent.market ? `${result.intent.market} market` : "All supported markets";
  const filters = result.intent.filters.length > 0 ? result.intent.filters.join(", ") : "company or ticker";
  const themes = result.intent.themes.length > 0 ? result.intent.themes.join(", ") : "No theme filter";
  const ambiguity = result.ambiguity
    ? `<p class="quality-warning">${escapeHtml(result.ambiguity.message)} ${result.ambiguity.candidateInstrumentIds.map(escapeHtml).join(", ")}</p>`
    : "";

  return [
    "<section>",
    "<h2>Interpreted query</h2>",
    `<p>${escapeHtml(market)} · Filters: ${escapeHtml(filters)} · Themes: ${escapeHtml(themes)}</p>`,
    ambiguity,
    "</section>",
  ].join("");
}

function renderSearchResults(
  result: NaturalLanguageSearchResult,
  cards: SearchResultCard[],
): string {
  if (result.noMatch) {
    return [
      "<section>",
      "<h2>No instruments matched</h2>",
      `<p>Understood terms: ${escapeHtml(result.noMatch.understoodTerms.join(", "))}</p>`,
      "<ul>",
      ...result.noMatch.suggestedPrompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`),
      "</ul>",
      "</section>",
    ].join("");
  }

  return [
    "<section>",
    "<h2>Ranked candidates</h2>",
    ...cards.map(renderCard),
    "</section>",
  ].join("");
}

function renderCard(card: SearchResultCard): string {
  return [
    '<article class="search-result-card">',
    `<h3>${escapeHtml(card.displayName)} <span>${escapeHtml(card.instrumentId)}</span></h3>`,
    `<p><strong>${escapeHtml(card.actionLabel)}</strong> · Confidence ${card.confidence} · ${escapeHtml(card.finality)}</p>`,
    `<p>Entry ${card.entryZone.low} - ${card.entryZone.high} · Stop ${card.stopLevel} · Target ${card.targetZone.low} - ${card.targetZone.high}</p>`,
    `<p>Match reasons: ${card.matchReasons.map(escapeHtml).join(", ")}</p>`,
    `<p>Portfolio action: ${escapeHtml(card.portfolioAction)}</p>`,
    `<p>AI contribution: ${card.aiContribution} · AI Weight Haircut: ${card.aiWeightHaircut}</p>`,
    `<p>Quality flags: ${card.qualityFlags.map(escapeHtml).join(", ") || "none"}</p>`,
    `<p>${escapeHtml(card.professionalContext)}</p>`,
    `<a href="${escapeHtml(card.detailHref)}">Open research detail</a>`,
    "</article>",
  ].join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

- [ ] **Step 6: Wire the dashboard page**

Replace `apps/web/app/page.tsx` with:

```typescript
import { renderDashboardSummary } from "../src/modules/dashboard-summary";
import { searchInstruments } from "../src/modules/natural-language-search";
import { assembleSearchResultCards } from "../src/modules/search-result-assembler";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "US AI infrastructure BUY candidates";
  const searchResult = searchInstruments(query);
  const html = renderDashboardSummary({
    query,
    searchResult,
    searchCards: assembleSearchResultCards(searchResult),
  });

  return <main dangerouslySetInnerHTML={{ __html: html }} />;
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run:

```bash
npm --prefix apps/web test -- --run tests/search-result-assembler.test.ts tests/dashboard.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/modules/search-result-assembler.ts apps/web/src/modules/dashboard-summary.ts apps/web/tests/search-result-assembler.test.ts apps/web/tests/dashboard.test.ts apps/web/app/page.tsx
git commit -m "feat: render natural language search dashboard"
```

---

### Task 3: Visualization view models

**Files:**
- Create: `apps/web/src/modules/visualizations.ts`
- Create: `apps/web/tests/visualizations.test.ts`

**Interfaces:**
- Consumes: `InstrumentId` from `apps/web/src/domain/market.ts`
- Produces:
  - `type VisualizationPanel<T>`
  - `type PriceVolumeChartModel`
  - `type IndicatorPanelModel`
  - `type SignalContributionModel`
  - `type RiskMetricModel`
  - `type BacktestChartModel`
  - `type PortfolioExposureModel`
  - `function buildVisualizationSuite(instrumentId: InstrumentId): VisualizationSuite`

- [ ] **Step 1: Write failing visualization tests**

Create `apps/web/tests/visualizations.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { buildVisualizationSuite } from "../src/modules/visualizations";

describe("visualization view models", () => {
  it("builds chart-ready data for a complete professional signal detail", () => {
    const suite = buildVisualizationSuite("US:XNAS:NVDA");

    expect(suite.priceVolume.state).toBe("available");
    expect(suite.priceVolume.data?.entryZone).toEqual({ low: 118, high: 124 });
    expect(suite.indicators.state).toBe("available");
    expect(suite.indicators.data?.rsi).toBe(61);
    expect(suite.signalContribution.data?.segments).toEqual([
      { label: "Rules and factors", value: 0.52 },
      { label: "AI context", value: 0.42 },
      { label: "AI Weight Haircut", value: -0.06 },
    ]);
    expect(suite.risk.data?.metrics.map((metric) => metric.label)).toContain("AI uncertainty");
    expect(suite.backtest.data?.maxDrawdown).toBe(0.18);
    expect(suite.portfolioExposure.data?.weights).toContainEqual({
      label: "Semiconductors",
      value: 0.34,
    });
  });

  it("returns explicit unavailable states when chart data is absent", () => {
    const suite = buildVisualizationSuite("KR:XKRX:000830");

    expect(suite.backtest).toEqual({
      state: "unavailable",
      reason: "Insufficient backtest sample for this instrument.",
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm --prefix apps/web test -- --run tests/visualizations.test.ts
```

Expected: FAIL with a missing `visualizations` module.

- [ ] **Step 3: Implement visualization view models**

Create `apps/web/src/modules/visualizations.ts`:

```typescript
import type { InstrumentId } from "../domain/market";

export type VisualizationPanel<T> =
  | { state: "available"; data: T }
  | { state: "unavailable"; reason: string };

export type PriceVolumeChartModel = {
  points: Array<{ date: string; close: number; volume: number }>;
  entryZone: { low: number; high: number };
  stopLevel: number;
  targetZone: { low: number; high: number };
  signalMarkers: Array<{ date: string; label: string }>;
};

export type IndicatorPanelModel = {
  movingAverage20: number;
  movingAverage60: number;
  rsi: number;
  macd: number;
  volatility: number;
  volumeSurge: number;
};

export type SignalContributionModel = {
  finalConfidence: number;
  segments: Array<{ label: string; value: number }>;
};

export type RiskMetricModel = {
  metrics: Array<{ label: string; value: number }>;
};

export type BacktestChartModel = {
  winRate: number;
  expectedValue: number;
  maxDrawdown: number;
  equityCurve: Array<{ period: string; value: number }>;
};

export type PortfolioExposureModel = {
  weights: Array<{ label: string; value: number }>;
};

export type VisualizationSuite = {
  priceVolume: VisualizationPanel<PriceVolumeChartModel>;
  indicators: VisualizationPanel<IndicatorPanelModel>;
  signalContribution: VisualizationPanel<SignalContributionModel>;
  risk: VisualizationPanel<RiskMetricModel>;
  backtest: VisualizationPanel<BacktestChartModel>;
  portfolioExposure: VisualizationPanel<PortfolioExposureModel>;
};

export function buildVisualizationSuite(instrumentId: InstrumentId): VisualizationSuite {
  if (instrumentId === "KR:XKRX:000830") {
    return {
      priceVolume: availablePriceVolume({ low: 154000, high: 159000 }, 148000, { low: 171000, high: 178000 }),
      indicators: availableIndicators(47),
      signalContribution: availableSignalContribution(0.57, 0.39, 0.18, 0),
      risk: availableRisk("moderate"),
      backtest: {
        state: "unavailable",
        reason: "Insufficient backtest sample for this instrument.",
      },
      portfolioExposure: availablePortfolioExposure("Industrials", 0.12),
    };
  }

  return {
    priceVolume: availablePriceVolume({ low: 118, high: 124 }, 109, { low: 138, high: 146 }),
    indicators: availableIndicators(61),
    signalContribution: availableSignalContribution(0.88, 0.52, 0.42, 0.06),
    risk: availableRisk("high"),
    backtest: {
      state: "available",
      data: {
        winRate: 0.58,
        expectedValue: 0.14,
        maxDrawdown: 0.18,
        equityCurve: [
          { period: "2022", value: 1 },
          { period: "2023", value: 1.18 },
          { period: "2024", value: 1.32 },
          { period: "2025", value: 1.41 },
        ],
      },
    },
    portfolioExposure: availablePortfolioExposure("Semiconductors", 0.34),
  };
}

function availablePriceVolume(
  entryZone: { low: number; high: number },
  stopLevel: number,
  targetZone: { low: number; high: number },
): VisualizationPanel<PriceVolumeChartModel> {
  return {
    state: "available",
    data: {
      points: [
        { date: "2026-06-14", close: entryZone.low - 3, volume: 1200000 },
        { date: "2026-06-15", close: entryZone.low, volume: 1420000 },
        { date: "2026-06-16", close: entryZone.high, volume: 1810000 },
        { date: "2026-06-17", close: entryZone.high + 2, volume: 1740000 },
      ],
      entryZone,
      stopLevel,
      targetZone,
      signalMarkers: [{ date: "2026-06-17", label: "Confirmed Signal" }],
    },
  };
}

function availableIndicators(rsi: number): VisualizationPanel<IndicatorPanelModel> {
  return {
    state: "available",
    data: {
      movingAverage20: 122,
      movingAverage60: 115,
      rsi,
      macd: 1.8,
      volatility: 0.24,
      volumeSurge: 1.42,
    },
  };
}

function availableSignalContribution(
  finalConfidence: number,
  rulesContribution: number,
  aiContribution: number,
  aiWeightHaircut: number,
): VisualizationPanel<SignalContributionModel> {
  return {
    state: "available",
    data: {
      finalConfidence,
      segments: [
        { label: "Rules and factors", value: rulesContribution },
        { label: "AI context", value: aiContribution },
        { label: "AI Weight Haircut", value: -aiWeightHaircut },
      ],
    },
  };
}

function availableRisk(level: "moderate" | "high"): VisualizationPanel<RiskMetricModel> {
  return {
    state: "available",
    data: {
      metrics: [
        { label: "Volatility", value: level === "high" ? 0.76 : 0.42 },
        { label: "Concentration", value: level === "high" ? 0.68 : 0.37 },
        { label: "Liquidity", value: 0.22 },
        { label: "Event risk", value: level === "high" ? 0.61 : 0.33 },
        { label: "Data quality", value: 0.18 },
        { label: "AI uncertainty", value: level === "high" ? 0.44 : 0.29 },
      ],
    },
  };
}

function availablePortfolioExposure(
  label: string,
  value: number,
): VisualizationPanel<PortfolioExposureModel> {
  return {
    state: "available",
    data: {
      weights: [{ label, value }],
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm --prefix apps/web test -- --run tests/visualizations.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/visualizations.ts apps/web/tests/visualizations.test.ts
git commit -m "feat: add signal visualization view models"
```

---

### Task 4: Professional research detail page

**Files:**
- Create: `apps/web/src/modules/research-detail.ts`
- Create: `apps/web/tests/research-detail.test.ts`
- Modify: `apps/web/app/signals/[instrumentId]/page.tsx`

**Interfaces:**
- Consumes:
  - `buildVisualizationSuite(instrumentId: InstrumentId): VisualizationSuite`
  - `InstrumentId`, `QualityFlag`
  - `ActionLabel`, `SignalDecision`
- Produces:
  - `type ResearchDetailViewModel`
  - `function buildResearchDetail(instrumentId: InstrumentId): ResearchDetailViewModel`
  - `function renderResearchDetailPage(detail: ResearchDetailViewModel): string`

- [ ] **Step 1: Write failing research detail tests**

Create `apps/web/tests/research-detail.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { buildResearchDetail, renderResearchDetailPage } from "../src/modules/research-detail";

describe("ResearchDetailAssembler", () => {
  it("builds and renders all report-grade professional sections", () => {
    const detail = buildResearchDetail("US:XNAS:NVDA");
    const html = renderResearchDetailPage(detail);

    expect(detail.instrumentId).toBe("US:XNAS:NVDA");
    expect(detail.tradeTimingPlan.actionLabel).toBe("BUY");
    expect(html).toContain("Executive Signal Brief");
    expect(html).toContain("Trade Timing Plan");
    expect(html).toContain("Evidence Stack");
    expect(html).toContain("Technical and Quant Dashboard");
    expect(html).toContain("AI Context and Citations");
    expect(html).toContain("Portfolio Impact");
    expect(html).toContain("Strategy Backtest");
    expect(html).toContain("Risk and Data Quality");
    expect(html).toContain("Audit Trail");
    expect(html).toContain("Research and Report Actions");
    expect(html).toContain("Entry Zone: 118 - 124");
    expect(html).toContain("AI Weight Haircut: 0.06");
    expect(html).toContain("Professional review required before external use.");
  });

  it("renders explicit unavailable states for missing backtest data", () => {
    const html = renderResearchDetailPage(buildResearchDetail("KR:XKRX:000830"));

    expect(html).toContain("Insufficient backtest sample for this instrument.");
    expect(html).toContain("Review required before interpreting performance support.");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm --prefix apps/web test -- --run tests/research-detail.test.ts
```

Expected: FAIL with a missing `research-detail` module.

- [ ] **Step 3: Implement the research detail module**

Create `apps/web/src/modules/research-detail.ts`:

```typescript
import type { InstrumentId, QualityFlag } from "../domain/market";
import type { ActionLabel, EvidenceSource, TradeTimingPlan } from "../domain/signals";
import { buildVisualizationSuite, type VisualizationSuite } from "./visualizations";

export type ResearchDetailViewModel = {
  instrumentId: InstrumentId;
  displayName: string;
  actionLabel: ActionLabel;
  confidence: number;
  finality: "provisional" | "confirmed";
  tradeTimingPlan: TradeTimingPlan;
  aiContribution: number;
  aiWeightHaircut: number;
  rationale: string[];
  evidence: EvidenceSource[];
  aiContext: {
    catalystScore: number;
    uncertaintyScore: number;
    evidenceQuality: number;
    freshnessScore: number;
    contradictionFlags: string[];
  };
  portfolioImpact: string;
  backtestSummary: {
    winRate?: number;
    expectedValue?: number;
    maxDrawdown?: number;
    averageHoldingPeriod?: string;
    limitation?: string;
  };
  qualityFlags: QualityFlag[];
  auditEvents: string[];
  visualizations: VisualizationSuite;
};

export function buildResearchDetail(instrumentId: InstrumentId): ResearchDetailViewModel {
  if (instrumentId === "KR:XKRX:000830") {
    return {
      instrumentId,
      displayName: "Samsung C&T",
      actionLabel: "HOLD",
      confidence: 0.57,
      finality: "confirmed",
      tradeTimingPlan: {
        actionLabel: "HOLD",
        entryZone: { low: 154000, high: 159000 },
        stopLevel: 148000,
        targetZone: { low: 171000, high: 178000 },
        timeHorizon: "days_to_weeks",
      },
      aiContribution: 0.18,
      aiWeightHaircut: 0,
      rationale: ["Dividend stability supports monitoring, but backtest evidence is limited."],
      evidence: [source("research", "Dividend stability screen", "https://example.com/samsung-ct")],
      aiContext: {
        catalystScore: 0.21,
        uncertaintyScore: 0.34,
        evidenceQuality: 0.63,
        freshnessScore: 0.72,
        contradictionFlags: [],
      },
      portfolioImpact: "Hold and monitor; avoid adding until backtest support improves.",
      backtestSummary: {
        limitation: "Insufficient backtest sample for this instrument.",
      },
      qualityFlags: ["insufficient_backtest_sample"],
      auditEvents: ["Confirmed Signal recalculated from end-of-day data."],
      visualizations: buildVisualizationSuite(instrumentId),
    };
  }

  return {
    instrumentId,
    displayName: instrumentId === "US:XNAS:AAPL" ? "Apple" : "NVIDIA",
    actionLabel: "BUY",
    confidence: instrumentId === "US:XNAS:AAPL" ? 0.82 : 0.88,
    finality: "confirmed",
    tradeTimingPlan: instrumentId === "US:XNAS:AAPL"
      ? {
          actionLabel: "BUY",
          entryZone: { low: 198, high: 204 },
          stopLevel: 188,
          targetZone: { low: 224, high: 232 },
          timeHorizon: "days_to_weeks",
        }
      : {
          actionLabel: "BUY",
          entryZone: { low: 118, high: 124 },
          stopLevel: 109,
          targetZone: { low: 138, high: 146 },
          timeHorizon: "days_to_weeks",
        },
    aiContribution: instrumentId === "US:XNAS:AAPL" ? 0.4 : 0.42,
    aiWeightHaircut: instrumentId === "US:XNAS:AAPL" ? 0 : 0.06,
    rationale: [
      "Trend, volume confirmation, and AI infrastructure catalyst evidence align with the Strategy Profile.",
      "High volatility requires disciplined entry and stop monitoring.",
    ],
    evidence: [
      source("price", "Price and volume confirmation", "https://example.com/price-volume"),
      source("news", "AI infrastructure demand update", "https://example.com/ai-demand"),
      source("filing", "Confirmed company filing reference", "https://example.com/filing"),
    ],
    aiContext: {
      catalystScore: 0.74,
      uncertaintyScore: 0.31,
      evidenceQuality: 0.82,
      freshnessScore: 0.91,
      contradictionFlags: [],
    },
    portfolioImpact: "Add-on candidate, but position size should respect semiconductor concentration.",
    backtestSummary: {
      winRate: 0.58,
      expectedValue: 0.14,
      maxDrawdown: 0.18,
      averageHoldingPeriod: "13 trading days",
    },
    qualityFlags: instrumentId === "US:XNAS:AAPL" ? ["confirmed_end_of_day_data"] : ["high_volatility"],
    auditEvents: [
      "Confirmed Signal recalculated from end-of-day data.",
      "Strategy Profile version swing-momentum-v1 applied.",
      "AI Weight Haircut recorded for source uncertainty.",
    ],
    visualizations: buildVisualizationSuite(instrumentId),
  };
}

export function renderResearchDetailPage(detail: ResearchDetailViewModel): string {
  return [
    '<article class="research-detail">',
    `<header><p>${escapeHtml(detail.instrumentId)}</p><h1>${escapeHtml(detail.displayName)} Research Detail</h1><p>Professional review required before external use.</p></header>`,
    section("Executive Signal Brief", [
      `<p><strong>${escapeHtml(detail.actionLabel)}</strong> · Confidence ${detail.confidence} · ${escapeHtml(detail.finality)}</p>`,
      `<p>${detail.rationale.map(escapeHtml).join(" ")}</p>`,
    ]),
    section("Trade Timing Plan", [
      `<p>Entry Zone: ${detail.tradeTimingPlan.entryZone.low} - ${detail.tradeTimingPlan.entryZone.high}</p>`,
      `<p>Stop Level: ${detail.tradeTimingPlan.stopLevel}</p>`,
      `<p>Target Zone: ${detail.tradeTimingPlan.targetZone.low} - ${detail.tradeTimingPlan.targetZone.high}</p>`,
      `<p>Time Horizon: ${escapeHtml(detail.tradeTimingPlan.timeHorizon)}</p>`,
    ]),
    section("Evidence Stack", detail.evidence.map((item) => `<p>${escapeHtml(item.sourceType)} · <a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a> · ${escapeHtml(item.finality)}</p>`)),
    section("Technical and Quant Dashboard", renderVisualizationSummary(detail)),
    section("AI Context and Citations", [
      `<p>Catalyst Score: ${detail.aiContext.catalystScore}</p>`,
      `<p>Uncertainty Score: ${detail.aiContext.uncertaintyScore}</p>`,
      `<p>Evidence Quality: ${detail.aiContext.evidenceQuality}</p>`,
      `<p>Freshness Score: ${detail.aiContext.freshnessScore}</p>`,
      `<p>AI contribution: ${detail.aiContribution} · AI Weight Haircut: ${detail.aiWeightHaircut}</p>`,
    ]),
    section("Portfolio Impact", [`<p>${escapeHtml(detail.portfolioImpact)}</p>`]),
    section("Strategy Backtest", renderBacktest(detail)),
    section("Risk and Data Quality", [
      `<p>Quality flags: ${detail.qualityFlags.map(escapeHtml).join(", ") || "none"}</p>`,
      "<p>Review required when data quality falls below configured thresholds.</p>",
    ]),
    section("Audit Trail", detail.auditEvents.map((event) => `<p>${escapeHtml(event)}</p>`)),
    section("Research and Report Actions", [
      "<p>Generate or update an editable Research Note from this evidence.</p>",
      "<p>Draft a Client Report only after Research Note approval and Portfolio context review.</p>",
    ]),
    "</article>",
  ].join("");
}

function renderVisualizationSummary(detail: ResearchDetailViewModel): string[] {
  const indicators = detail.visualizations.indicators;
  const priceVolume = detail.visualizations.priceVolume;
  return [
    priceVolume.state === "available"
      ? `<p>Price chart includes entry zone, stop level, target zone, and signal-change markers.</p>`
      : `<p>${escapeHtml(priceVolume.reason)}</p>`,
    indicators.state === "available"
      ? `<p>RSI ${indicators.data.rsi} · MACD ${indicators.data.macd} · Volume surge ${indicators.data.volumeSurge}</p>`
      : `<p>${escapeHtml(indicators.reason)}</p>`,
  ];
}

function renderBacktest(detail: ResearchDetailViewModel): string[] {
  if (detail.backtestSummary.limitation) {
    return [
      `<p>${escapeHtml(detail.backtestSummary.limitation)}</p>`,
      "<p>Review required before interpreting performance support.</p>",
    ];
  }
  return [
    `<p>Win Rate: ${detail.backtestSummary.winRate}</p>`,
    `<p>Expected Value: ${detail.backtestSummary.expectedValue}</p>`,
    `<p>Maximum Drawdown: ${detail.backtestSummary.maxDrawdown}</p>`,
    `<p>Average Holding Period: ${escapeHtml(detail.backtestSummary.averageHoldingPeriod ? detail.backtestSummary.averageHoldingPeriod : "unavailable")}</p>`,
  ];
}

function section(title: string, rows: string[]): string {
  return [`<section><h2>${escapeHtml(title)}</h2>`, ...rows, "</section>"].join("");
}

function source(sourceType: EvidenceSource["sourceType"], title: string, url: string): EvidenceSource {
  return {
    sourceType,
    title,
    url,
    observedAt: "2026-06-18T00:00:00.000Z",
    finality: "confirmed",
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

- [ ] **Step 4: Wire the detail page**

Replace `apps/web/app/signals/[instrumentId]/page.tsx` with:

```typescript
import type { InstrumentId } from "../../../src/domain/market";
import { buildResearchDetail, renderResearchDetailPage } from "../../../src/modules/research-detail";

export default async function SignalDetailPage({
  params,
}: {
  params: Promise<{ instrumentId: string }>;
}) {
  const { instrumentId } = await params;
  const detail = buildResearchDetail(decodeURIComponent(instrumentId) as InstrumentId);
  const html = renderResearchDetailPage(detail);

  return <main dangerouslySetInnerHTML={{ __html: html }} />;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run:

```bash
npm --prefix apps/web test -- --run tests/research-detail.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/research-detail.ts apps/web/tests/research-detail.test.ts apps/web/app/signals/[instrumentId]/page.tsx
git commit -m "feat: render professional signal research detail"
```

---

### Task 5: Full validation and integration polish

**Files:**
- Modify: files from Tasks 1-4 only if typecheck, build, or integration tests expose defects.

**Interfaces:**
- Consumes:
  - `searchInstruments(query: string): NaturalLanguageSearchResult`
  - `assembleSearchResultCards(result: NaturalLanguageSearchResult): SearchResultCard[]`
  - `buildResearchDetail(instrumentId: InstrumentId): ResearchDetailViewModel`
  - `renderResearchDetailPage(detail: ResearchDetailViewModel): string`
- Produces: a passing test suite and typecheck for the natural language search and professional detail feature.

- [ ] **Step 1: Run the complete web test suite**

Run:

```bash
npm --prefix apps/web test -- --run
```

Expected: PASS for all web tests.

- [ ] **Step 2: Run the web typecheck**

Run:

```bash
npm --prefix apps/web run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 3: Run the web build**

Run:

```bash
npm --prefix apps/web run build
```

Expected: PASS and a successful Next.js production build.

- [ ] **Step 4: Fix any validation defects with focused tests**

If Step 1, Step 2, or Step 3 fails, change only the files introduced or modified by this plan. Add or adjust a focused test that proves the defect is fixed, then rerun the failing command.

For example, if `decodeURIComponent` handling fails for an encoded InstrumentId route, add this test to `apps/web/tests/research-detail.test.ts`:

```typescript
it("builds detail for an encoded InstrumentId after route decoding", () => {
  const decoded = decodeURIComponent("US%3AXNAS%3ANVDA");

  expect(buildResearchDetail(decoded as "US:XNAS:NVDA").instrumentId).toBe("US:XNAS:NVDA");
});
```

Then run:

```bash
npm --prefix apps/web test -- --run tests/research-detail.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit validation fixes or record no-op validation**

If files changed during Task 5, run:

```bash
git add apps/web
git commit -m "fix: polish natural language research integration"
```

If no files changed during Task 5, do not create an empty commit. Record the passing commands in the task completion note.
