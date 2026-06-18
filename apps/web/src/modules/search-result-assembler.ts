import type { DataFinality, InstrumentId, QualityFlag } from "../domain/market";
import type { PortfolioActionLabel } from "../domain/portfolio";
import type { ActionLabel, TradeTimingPlan } from "../domain/signals";
import type { InstrumentSearchCandidate, InstrumentSearchResult } from "./instrument-search";
import type { SearchMode } from "./search-intent";

export type SearchResultCard = {
  instrumentId: InstrumentId;
  displayName: string;
  primaryMode: SearchMode;
  actionLabel: ActionLabel;
  confidence: number;
  finality: DataFinality;
  tradeTimingPlan: TradeTimingPlan;
  aiContribution: number;
  aiWeightHaircut: number;
  portfolioAction: PortfolioActionLabel;
  screeningEvidenceQuality?: "strong" | "weak";
  qualityFlags: QualityFlag[];
  rankingBreakdown: string[];
  portfolioStateMessage?: string;
  detailHref: string;
};

type SignalFixture = Omit<
  SearchResultCard,
  | "displayName"
  | "primaryMode"
  | "screeningEvidenceQuality"
  | "qualityFlags"
  | "rankingBreakdown"
  | "portfolioStateMessage"
  | "detailHref"
>;

const signals: Record<InstrumentId, SignalFixture> = {
  "KR:XKRX:005930": signal("KR:XKRX:005930", "HOLD", 0.64, { low: 71000, high: 73500 }, 67500, { low: 79000, high: 82500 }, 0.21, 0.08, "REVIEW_REQUIRED"),
  "KR:XKRX:000830": signal("KR:XKRX:000830", "HOLD", 0.57, { low: 154000, high: 159000 }, 148000, { low: 171000, high: 178000 }, 0.18, 0, "HOLD_AND_MONITOR"),
  "US:XNAS:AAPL": signal("US:XNAS:AAPL", "BUY", 0.82, { low: 198, high: 204 }, 188, { low: 224, high: 232 }, 0.4, 0, "NEW_BUY_CANDIDATE"),
  "US:XNAS:NVDA": signal("US:XNAS:NVDA", "BUY", 0.88, { low: 118, high: 124 }, 109, { low: 138, high: 146 }, 0.42, 0.06, "ADD_ON_CANDIDATE"),
};

export function assembleSearchResultCards(result: InstrumentSearchResult): SearchResultCard[] {
  return result.primaryCandidates
    .flatMap((candidate) => {
      const signalFixture = signals[candidate.instrumentId];
      if (!signalFixture) {
        return [];
      }
      const screeningEvidenceQuality = candidate.screeningEvidence?.quality;
      return [{
        ...signalFixture,
        displayName: candidate.displayName,
        primaryMode: candidate.primaryMode,
        ...(screeningEvidenceQuality ? { screeningEvidenceQuality } : {}),
        qualityFlags: candidate.qualityFlags,
        rankingBreakdown: rankingBreakdown(signalFixture.confidence, screeningEvidenceQuality, candidate.qualityFlags),
        ...(!result.portfolioState.available && result.portfolioState.message
          ? { portfolioStateMessage: result.portfolioState.message }
          : {}),
        detailHref: `/signals/${encodeURIComponent(candidate.instrumentId)}`,
      }];
    })
    .sort((left, right) => rank(right) - rank(left));
}

function rankingBreakdown(
  confidence: number,
  screeningEvidenceQuality: "strong" | "weak" | undefined,
  qualityFlags: QualityFlag[],
): string[] {
  return [
    "Search Intent fit: 1",
    `Confirmed Signal confidence: ${confidence}`,
    `Screening Evidence quality: ${screeningEvidenceQuality === "strong" ? 1 : screeningEvidenceQuality === "weak" ? 0.35 : 0}`,
    "Portfolio relevance: 0",
    `Risk penalty: ${qualityFlags.includes("high_volatility") ? -0.2 : 0}`,
  ];
}

function rank(card: SearchResultCard): number {
  const evidence = card.screeningEvidenceQuality === "strong" ? 1 : card.screeningEvidenceQuality === "weak" ? 0.35 : 0;
  const riskPenalty = card.qualityFlags.includes("high_volatility") ? -0.2 : 0;
  return 1 * 10 + card.confidence + evidence + riskPenalty;
}

function signal(
  instrumentId: InstrumentId,
  actionLabel: ActionLabel,
  confidence: number,
  entryZone: { low: number; high: number },
  stopLevel: number,
  targetZone: { low: number; high: number },
  aiContribution: number,
  aiWeightHaircut: number,
  portfolioAction: PortfolioActionLabel,
): SignalFixture {
  return {
    instrumentId,
    actionLabel,
    confidence,
    finality: "confirmed",
    tradeTimingPlan: {
      actionLabel,
      entryZone,
      stopLevel,
      targetZone,
      timeHorizon: "days_to_weeks",
    },
    aiContribution,
    aiWeightHaircut,
    portfolioAction,
  };
}
