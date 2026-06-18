import { describe, expect, it } from "vitest";
import { createAnalysisRunner } from "../src/modules/analysis-runner";

describe("AnalysisRunner", () => {
  it("maps worker response into a SignalDecision and sends source evidence", async () => {
    const sourceEvidence = [
      {
        sourceId: "news-1",
        sourceType: "news" as const,
        title: "AAPL catalyst coverage",
        url: "https://example.com/aapl-news",
        observedAt: "2026-06-18T00:00:00.000Z",
        finality: "confirmed" as const,
      },
      {
        sourceId: "filing-1",
        sourceType: "filing" as const,
        title: "AAPL filing context",
        url: "https://example.com/aapl-filing",
        observedAt: "2026-06-18T00:00:00.000Z",
        finality: "confirmed" as const,
      },
    ];
    const runner = createAnalysisRunner({
      workerUrl: "https://worker.example.test",
      fetchJson: async (_url, init) => {
        const body = JSON.parse(init.body as string);
        expect(body.sourceEvidence).toEqual(sourceEvidence);

        return {
          instrumentId: "US:XNAS:AAPL",
          finality: "confirmed",
          confidence: 0.75,
          rulesContribution: 0.4,
          aiContribution: 0.35,
          aiWeightHaircut: 0,
          qualityFlags: ["confirmed_end_of_day_data"],
          sourceEvidence,
          tradeTimingPlan: {
            actionLabel: "BUY",
            entryZone: { low: 98, high: 102 },
            stopLevel: 92,
            targetZone: { low: 110, high: 116 },
            timeHorizon: "days_to_weeks",
          },
          rationale: ["Rules contribution: 0.4"],
        };
      },
    });

    const decision = await runner.runAnalysis({
      instrumentId: "US:XNAS:AAPL",
      finality: "confirmed",
      bars: [],
      aiContext: {
        catalyst_score: 0.7,
        uncertainty_score: 0.2,
        evidence_quality_score: 0.9,
        freshness_score: 0.9,
        contradiction_count: 0,
        source_count: 2,
      },
      sourceEvidence,
    });

    expect(decision.tradeTimingPlan.actionLabel).toBe("BUY");
    expect(decision.finality).toBe("confirmed");
    expect(decision.sourceEvidence).toEqual(sourceEvidence);
  });
});
