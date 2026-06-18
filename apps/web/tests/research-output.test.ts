import { describe, expect, it } from "vitest";
import { draftClientReport, draftResearchNote } from "../src/modules/research-output";
import type { SignalDecision } from "../src/domain/signals";

const decision: SignalDecision = {
  instrumentId: "US:XNAS:AAPL",
  finality: "confirmed",
  confidence: 0.82,
  rulesContribution: 0.42,
  aiContribution: 0.4,
  aiWeightHaircut: 0,
  qualityFlags: [],
  sourceEvidence: [
    {
      sourceId: "filing-1",
      sourceType: "filing",
      title: "AAPL filing",
      url: "https://example.com/aapl-filing",
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
  rationale: ["Trend and AI catalyst align."],
};

describe("ResearchOutputModule", () => {
  it("drafts an editable Research Note with professional-review context", () => {
    const note = draftResearchNote({
      id: "note-1",
      signalDecision: decision,
      portfolioExplanation: "New buy candidate.",
      createdAt: "2026-06-18T00:00:00.000Z",
    });

    expect(note.title).toBe("Research Note: US:XNAS:AAPL BUY");
    expect(note.bodyMarkdown).toContain("Professional review required before external use.");
    expect(note.bodyMarkdown).toContain("Entry Zone: 98 - 102");
    expect(note.approved).toBe(false);
  });

  it("rejects Client Reports built from unapproved Research Notes", () => {
    const note = draftResearchNote({
      id: "note-1",
      signalDecision: decision,
      portfolioExplanation: "New buy candidate.",
      createdAt: "2026-06-18T00:00:00.000Z",
    });

    expect(() =>
      draftClientReport({
        id: "report-1",
        title: "Client Report",
        approvedResearchNotes: [note],
      }),
    ).toThrow("Client Report can only use approved Research Notes");
  });
});
