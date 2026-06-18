import { describe, expect, it } from "vitest";
import { searchInstruments } from "../src/modules/instrument-search";
import type { InstrumentSearchResult } from "../src/modules/instrument-search";
import { assembleSearchResultCards } from "../src/modules/search-result-assembler";

describe("Search Result Assembler", () => {
  it("applies Result Ranking Policy with Search Intent fit first", () => {
    const cards = assembleSearchResultCards(searchInstruments("US AI infrastructure BUY candidates"));

    expect(cards[0]).toMatchObject({
      instrumentId: "US:XNAS:NVDA",
      displayName: "NVIDIA",
      primaryMode: "investment_idea_screen",
      actionLabel: "BUY",
      confidence: 0.88,
      screeningEvidenceQuality: "strong",
    });
    expect(cards[0].rankingBreakdown).toEqual([
      "Search Intent fit: 1",
      "Confirmed Signal confidence: 0.88",
      "Screening Evidence quality: 1",
      "Portfolio relevance: 0",
      "Risk penalty: -0.2",
    ]);
  });

  it("shows portfolio unavailable state without silently applying portfolio ranking", () => {
    const cards = assembleSearchResultCards(searchInstruments("삼성", { portfolioAvailable: false }));

    expect(cards[0].portfolioStateMessage).toBe(
      "Portfolio unavailable; portfolio conditions were not included in ranking.",
    );
  });

  it("does not fabricate cards when portfolio-unavailable searches have no candidate matches", () => {
    const cards = assembleSearchResultCards(
      searchInstruments("내 포트폴리오에서 손절 가까운 종목", { portfolioAvailable: false }),
    );

    expect(cards).toEqual([]);
  });

  it("skips candidates when no signal fixture is available", () => {
    const result: InstrumentSearchResult = {
      intent: searchInstruments("AAPL").intent,
      primaryCandidates: [
        {
          instrumentId: "US:XNAS:MSFT",
          displayName: "Microsoft",
          market: "US",
          ticker: "MSFT",
          primaryMode: "stock_lookup",
          themes: [],
          sectors: [],
          matchReasons: ["ticker_match"],
          qualityFlags: ["confirmed_end_of_day_data"],
        },
      ],
      relatedScreenCandidates: [],
      portfolioState: { available: true },
    };

    expect(assembleSearchResultCards(result)).toEqual([]);
  });
});
