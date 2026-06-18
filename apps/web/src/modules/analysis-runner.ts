import type { DataFinality, InstrumentId, OhlcvBar, QualityFlag } from "../domain/market";
import type { EvidenceSource, SignalDecision } from "../domain/signals";

type AnalysisRunRequest = {
  instrumentId: InstrumentId;
  finality: DataFinality;
  bars: OhlcvBar[] | Array<Record<string, number | string>>;
  aiContext: {
    catalyst_score: number;
    uncertainty_score: number;
    evidence_quality_score: number;
    freshness_score: number;
    contradiction_count: number;
    source_count: number;
  };
  sourceEvidence: EvidenceSource[];
};

type AnalysisRunnerConfig = {
  workerUrl: string;
  fetchJson?: (url: string, init: RequestInit) => Promise<unknown>;
};

export type AnalysisRunner = {
  runAnalysis(request: AnalysisRunRequest): Promise<SignalDecision>;
};

export function createAnalysisRunner(config: AnalysisRunnerConfig): AnalysisRunner {
  const fetchJson = config.fetchJson ?? defaultFetchJson;

  return {
    async runAnalysis(request) {
      const response = (await fetchJson(`${config.workerUrl}/analysis/run`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(request),
      })) as SignalDecision;

      return {
        instrumentId: response.instrumentId,
        finality: response.finality,
        confidence: response.confidence,
        rulesContribution: response.rulesContribution,
        aiContribution: response.aiContribution,
        aiWeightHaircut: response.aiWeightHaircut,
        qualityFlags: response.qualityFlags as QualityFlag[],
        sourceEvidence: response.sourceEvidence,
        tradeTimingPlan: response.tradeTimingPlan,
        rationale: response.rationale,
      };
    },
  };
}

async function defaultFetchJson(url: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Analysis worker request failed with ${response.status}`);
  }
  return response.json();
}
