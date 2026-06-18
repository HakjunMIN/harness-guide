import { describe, expect, it } from "vitest";
import { createPrismaSignalRepository } from "../src/persistence/repositories";
import type { SignalDecision } from "../src/domain/signals";

describe("SignalRepository", () => {
  it("persists a SignalDecision with source evidence and trade timing plan", async () => {
    const creates: unknown[] = [];
    const repository = createPrismaSignalRepository({
      signal: {
        async create(args) {
          creates.push(args.data);
          return { id: "signal-1" };
        },
      },
    });
    const decision: SignalDecision = {
      instrumentId: "US:XNAS:AAPL",
      finality: "confirmed",
      confidence: 0.75,
      rulesContribution: 0.4,
      aiContribution: 0.35,
      aiWeightHaircut: 0,
      qualityFlags: ["confirmed_end_of_day_data"],
      sourceEvidence: [
        {
          sourceId: "news-1",
          sourceType: "news",
          title: "AAPL catalyst coverage",
          url: "https://example.com/aapl-news",
          observedAt: "2026-06-18T00:00:00.000Z",
          finality: "confirmed",
        },
      ],
      tradeTimingPlan: {
        actionLabel: "BUY",
        entryZone: { low: 98, high: 102 },
        stopLevel: 92,
        targetZone: { low: 110, high: 116 },
        timeHorizon: "days_to_weeks",
      },
      rationale: ["Rules contribution: 0.4"],
    };

    const saved = await repository.saveSignal("workspace-1", decision);

    expect(saved.id).toBe("signal-1");
    expect(creates).toEqual([
      {
        workspaceId: "workspace-1",
        instrumentId: "US:XNAS:AAPL",
        finality: "confirmed",
        actionLabel: "BUY",
        confidence: 0.75,
        rulesContribution: 0.4,
        aiContribution: 0.35,
        aiWeightHaircut: 0,
        qualityFlags: ["confirmed_end_of_day_data"],
        sourceEvidence: decision.sourceEvidence,
        tradeTimingPlan: decision.tradeTimingPlan,
        rationale: ["Rules contribution: 0.4"],
      },
    ]);
  });
});
