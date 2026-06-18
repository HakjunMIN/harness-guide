import type { ClientReport, ResearchNote } from "../domain/research";
import type { SignalDecision } from "../domain/signals";

export function draftResearchNote(input: {
  id: string;
  signalDecision: SignalDecision;
  portfolioExplanation: string;
  createdAt: string;
}): ResearchNote {
  const plan = input.signalDecision.tradeTimingPlan;
  return {
    id: input.id,
    instrumentId: input.signalDecision.instrumentId,
    title: `Research Note: ${input.signalDecision.instrumentId} ${plan.actionLabel}`,
    approved: false,
    createdAt: input.createdAt,
    bodyMarkdown: [
      `# ${input.signalDecision.instrumentId} ${plan.actionLabel}`,
      "",
      "Professional review required before external use.",
      "",
      `Confidence: ${input.signalDecision.confidence}`,
      `Entry Zone: ${plan.entryZone.low} - ${plan.entryZone.high}`,
      `Stop Level: ${plan.stopLevel}`,
      `Target Zone: ${plan.targetZone.low} - ${plan.targetZone.high}`,
      `Time Horizon: ${plan.timeHorizon}`,
      "",
      "## Portfolio Context",
      input.portfolioExplanation,
      "",
      "## Evidence",
      ...input.signalDecision.sourceEvidence.map((source) => `- ${source.sourceType}: ${source.title}`),
      ...input.signalDecision.rationale.map((line) => `- ${line}`),
    ].join("\n"),
  };
}

export function draftClientReport(input: {
  id: string;
  title: string;
  approvedResearchNotes: ResearchNote[];
}): ClientReport {
  if (input.approvedResearchNotes.some((note) => !note.approved)) {
    throw new Error("Client Report can only use approved Research Notes");
  }

  return {
    id: input.id,
    title: input.title,
    approved: false,
    bodyMarkdown: [
      `# ${input.title}`,
      "",
      "This report is prepared for professional review before sharing.",
      "",
      ...input.approvedResearchNotes.map((note) => note.bodyMarkdown),
    ].join("\n\n"),
  };
}
