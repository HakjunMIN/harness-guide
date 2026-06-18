import type { SignalDecision } from "../domain/signals";

export type SignalRepository = {
  saveSignal(workspaceId: string, decision: SignalDecision): Promise<{ id: string }>;
};

export function createPrismaSignalRepository(client: {
  signal: {
    create(args: {
      data: {
        workspaceId: string;
        instrumentId: string;
        finality: string;
        actionLabel: string;
        confidence: number;
        rulesContribution: number;
        aiContribution: number;
        aiWeightHaircut: number;
        qualityFlags: unknown;
        sourceEvidence: unknown;
        tradeTimingPlan: unknown;
        rationale: unknown;
      };
    }): Promise<{ id: string }>;
  };
}): SignalRepository {
  return {
    async saveSignal(workspaceId, decision) {
      return client.signal.create({
        data: {
          workspaceId,
          instrumentId: decision.instrumentId,
          finality: decision.finality,
          actionLabel: decision.tradeTimingPlan.actionLabel,
          confidence: decision.confidence,
          rulesContribution: decision.rulesContribution,
          aiContribution: decision.aiContribution,
          aiWeightHaircut: decision.aiWeightHaircut,
          qualityFlags: decision.qualityFlags,
          sourceEvidence: decision.sourceEvidence,
          tradeTimingPlan: decision.tradeTimingPlan,
          rationale: decision.rationale,
        },
      });
    },
  };
}
