import type { InstrumentId, QualityFlag } from "../domain/market";
import type { ActionLabel, EvidenceSource, TradeTimingPlan } from "../domain/signals";
import { formatPercent, formatPrice, formatPriceRange } from "./formatters";
import { buildResearchChartSuite, type ChartPanel, type ResearchChartSuite } from "./research-chart-models";

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
  conflictingEvidence: string[];
  evidence: EvidenceSource[];
  qualityFlags: QualityFlag[];
  portfolioAvailable: boolean;
  portfolioImpact: string;
  backtestLimitation?: string;
  auditEvents: string[];
  charts: ResearchChartSuite;
};

type ResearchFixture = {
  displayName: string;
  actionLabel: ActionLabel;
  confidence: number;
  tradeTimingPlan: TradeTimingPlan;
  aiContribution: number;
  aiWeightHaircut: number;
  rationale: string[];
  conflictingEvidence: string[];
  qualityFlags: QualityFlag[];
  portfolioImpact: string;
  backtestLimitation?: string;
};

export type ReportPanelId = "evidence" | "technical" | "ai-context" | "portfolio" | "backtest" | "risk" | "audit" | "actions";

const reportPanelIds: ReportPanelId[] = ["evidence", "technical", "ai-context", "portfolio", "backtest", "risk", "audit", "actions"];

export function parseReportPanelId(value: string | undefined): ReportPanelId | undefined {
  if (!value) {
    return undefined;
  }

  return reportPanelIds.find((panelId) => panelId === value);
}

export function buildResearchDetail(
  instrumentId: InstrumentId,
  options: { portfolioAvailable?: boolean } = {},
): ResearchDetailViewModel {
  const portfolioAvailable = options.portfolioAvailable !== false;
  const fixture = researchFixtures[instrumentId];

  if (!fixture) {
    return {
      instrumentId,
      displayName: "Unsupported instrument",
      actionLabel: "REVIEW_REQUIRED",
      confidence: 0,
      finality: "confirmed",
      tradeTimingPlan: timing("REVIEW_REQUIRED", 0, 0, 0, 0, 0),
      aiContribution: 0,
      aiWeightHaircut: 0,
      rationale: ["Unsupported instrument. Detail research data is not available for this instrument."],
      conflictingEvidence: ["Review Required conditions apply before interpreting this signal."],
      evidence: [],
      qualityFlags: ["missing_price_data", "missing_event_data"],
      portfolioAvailable,
      portfolioImpact: portfolioAvailable
        ? "Portfolio impact unavailable for unsupported detail research."
        : "Portfolio unavailable; portfolio-specific claims are not shown.",
      backtestLimitation: "Insufficient backtest sample for this instrument.",
      auditEvents: ["Unsupported detail request recorded for professional review."],
      charts: unavailableChartSuite("Unsupported instrument. Detail chart data is not available."),
    };
  }

  return {
    instrumentId,
    displayName: fixture.displayName,
    actionLabel: fixture.actionLabel,
    confidence: fixture.confidence,
    finality: "confirmed",
    tradeTimingPlan: fixture.tradeTimingPlan,
    aiContribution: fixture.aiContribution,
    aiWeightHaircut: fixture.aiWeightHaircut,
    rationale: fixture.rationale,
    conflictingEvidence: fixture.conflictingEvidence,
    evidence: [
      {
        sourceType: "news",
        title: "AI infrastructure demand update",
        url: "https://example.com/ai-demand",
        observedAt: "2026-06-18T00:00:00.000Z",
        finality: "confirmed",
      },
    ],
    qualityFlags: fixture.qualityFlags,
    portfolioAvailable,
    portfolioImpact: portfolioAvailable
      ? fixture.portfolioImpact
      : "Portfolio unavailable; portfolio-specific claims are not shown.",
    ...(fixture.backtestLimitation ? { backtestLimitation: fixture.backtestLimitation } : {}),
    auditEvents: [
      "Confirmed Signal recalculated from end-of-day data.",
      "Strategy Profile version swing-momentum-v1 applied.",
      "AI Weight Haircut recorded for source uncertainty.",
    ],
    charts: chartsFor(instrumentId, portfolioAvailable),
  };
}

const researchFixtures: Partial<Record<InstrumentId, ResearchFixture>> = {
  "KR:XKRX:005930": {
    displayName: "Samsung Electronics",
    actionLabel: "HOLD",
    confidence: 0.64,
    tradeTimingPlan: timing("HOLD", 71000, 73500, 67500, 79000, 82500),
    aiContribution: 0.21,
    aiWeightHaircut: 0.08,
    rationale: ["Memory semiconductor recovery and AI infrastructure exposure support a monitored HOLD setup."],
    conflictingEvidence: ["Cycle sensitivity and export demand uncertainty require professional review."],
    qualityFlags: ["confirmed_end_of_day_data"],
    portfolioImpact: "Core Korean semiconductor exposure; monitor concentration before adding risk.",
  },
  "KR:XKRX:000830": {
    displayName: "Samsung C&T",
    actionLabel: "REVIEW_REQUIRED",
    confidence: 0.57,
    tradeTimingPlan: timing("REVIEW_REQUIRED", 154000, 159000, 148000, 171000, 178000),
    aiContribution: 0.18,
    aiWeightHaircut: 0,
    rationale: ["Dividend stability supports monitoring, but backtest evidence is limited."],
    conflictingEvidence: ["Insufficient backtest sample for this instrument."],
    qualityFlags: ["insufficient_backtest_sample"],
    portfolioImpact: "Dividend stability candidate; monitor industrials exposure.",
    backtestLimitation: "Insufficient backtest sample for this instrument.",
  },
  "US:XNAS:AAPL": {
    displayName: "Apple",
    actionLabel: "BUY",
    confidence: 0.82,
    tradeTimingPlan: timing("BUY", 198, 204, 188, 224, 232),
    aiContribution: 0.4,
    aiWeightHaircut: 0,
    rationale: ["Quality growth and consumer AI evidence align with the Strategy Profile."],
    conflictingEvidence: ["Product-cycle uncertainty requires disciplined entry monitoring."],
    qualityFlags: ["confirmed_end_of_day_data"],
    portfolioImpact: "Quality growth candidate; review mega-cap technology concentration.",
  },
  "US:XNAS:NVDA": {
    displayName: "NVIDIA",
    actionLabel: "BUY",
    confidence: 0.88,
    tradeTimingPlan: timing("BUY", 118, 124, 109, 138, 146),
    aiContribution: 0.42,
    aiWeightHaircut: 0.06,
    rationale: ["Trend, volume confirmation, and AI infrastructure catalyst evidence align with the Strategy Profile."],
    conflictingEvidence: ["High volatility requires disciplined entry and stop monitoring."],
    qualityFlags: ["high_volatility"],
    portfolioImpact: "Add-on candidate, but position size should respect semiconductor concentration.",
  },
};

function chartsFor(instrumentId: InstrumentId, portfolioAvailable: boolean): ResearchChartSuite {
  const charts = buildResearchChartSuite(instrumentId);
  if (portfolioAvailable) {
    return charts;
  }

  return {
    ...charts,
    portfolioExposure: {
      state: "unavailable",
      reason: "Portfolio unavailable; portfolio-specific claims are not shown.",
    },
  };
}

function unavailableChartSuite(reason: string): ResearchChartSuite {
  return {
    priceVolume: { state: "unavailable", reason },
    indicators: { state: "unavailable", reason },
    contribution: { state: "unavailable", reason },
    risk: { state: "unavailable", reason },
    backtest: { state: "unavailable", reason },
    portfolioExposure: { state: "unavailable", reason },
  };
}

export function renderResearchDetailPage(
  detail: ResearchDetailViewModel,
  options: { selectedPanel?: ReportPanelId } = {},
): string {
  const selectedPanel = options.selectedPanel ?? "evidence";
  const panelRows = reportPanelRows(detail);
  return [
    '<article class="research-detail">',
    `<header class="terminal-header"><p>${escapeHtml(detail.instrumentId)}</p><h1>${escapeHtml(detail.displayName)} Research Detail</h1></header>`,
    fixedSummary(detail),
    primaryChartPanel(detail.charts.priceVolume),
    '<section class="report-tabs" aria-label="Report tabs"><h2>Report tabs</h2>',
    tabNav(selectedPanel),
    panel(panelRows[selectedPanel], true),
    "</section>",
    "</article>",
  ].join("");
}

function tabNav(selectedPanel: ReportPanelId): string {
  const tabs: Array<{ id: ReportPanelId; label: string }> = [
    { id: "evidence", label: "Evidence" },
    { id: "technical", label: "Technical" },
    { id: "ai-context", label: "AI Context" },
    { id: "portfolio", label: "Portfolio" },
    { id: "backtest", label: "Backtest" },
    { id: "risk", label: "Risk" },
    { id: "audit", label: "Audit" },
    { id: "actions", label: "Research Actions" },
  ];
  return [
    '<nav class="segmented-tabs" aria-label="Research Report Panels">',
    ...tabs.map(({ id, label }) => {
      const active = id === selectedPanel;
      return `<a class="tab-chip${active ? " active" : ""}" href="?panel=${id}"${active ? ' aria-current="page"' : ""}>${escapeHtml(label)}</a>`;
    }),
    "</nav>",
  ].join("");
}

function reportPanelRows(detail: ResearchDetailViewModel): Record<ReportPanelId, { id: ReportPanelId; title: string; rows: string[] }> {
  return {
    evidence: {
      id: "evidence",
      title: "Evidence Panel",
      rows: [...detail.evidence.map((source) => `${source.sourceType}: ${source.title}`), ...detail.conflictingEvidence],
    },
    technical: {
      id: "technical",
      title: "Technical Report Panel",
      rows: ["Recharts technical indicators are rendered from chart-ready models."],
    },
    "ai-context": {
      id: "ai-context",
      title: "AI Context Report Panel",
      rows: [`AI contribution: ${formatPercent(detail.aiContribution)}`, `AI Weight Haircut: ${formatPercent(detail.aiWeightHaircut)}`],
    },
    portfolio: { id: "portfolio", title: "Portfolio Impact Report Panel", rows: [detail.portfolioImpact] },
    backtest: {
      id: "backtest",
      title: "Backtest Report Panel",
      rows: detail.backtestLimitation
        ? [detail.backtestLimitation, "Review required before interpreting performance support."]
        : ["Win rate, expected value, maximum drawdown, and equity curve available."],
    },
    risk: {
      id: "risk",
      title: "Risk Report Panel",
      rows: [`Quality flags: ${detail.qualityFlags.join(", ")}`, ...detail.conflictingEvidence],
    },
    audit: { id: "audit", title: "Audit Panel", rows: detail.auditEvents },
    actions: {
      id: "actions",
      title: "Research and Report Actions Panel",
      rows: [
        "Generate or update an editable Research Note from this evidence.",
        "Draft a Client Report only after Research Note approval and Portfolio context review.",
      ],
    },
  };
}

function fixedSummary(detail: ResearchDetailViewModel): string {
  const actionClass =
    detail.actionLabel === "BUY"
      ? "action-buy"
      : detail.actionLabel === "HOLD"
        ? "action-hold"
        : detail.actionLabel === "SELL"
          ? "action-sell"
          : "action-review";

  return [
    '<section class="fixed-summary">',
    '<div class="command-bar">',
    `<span>${escapeHtml(detail.instrumentId)}</span>`,
    `<span class="action-badge ${actionClass}">${escapeHtml(detail.actionLabel)}</span>`,
    `<span>Confidence ${formatPercent(detail.confidence)}</span>`,
    `<span>${escapeHtml(detail.finality)}</span>`,
    "<span>Review Required conditions visible</span>",
    "</div>",
    "<h2>Signal Brief</h2>",
    `<p><strong>${escapeHtml(detail.actionLabel)}</strong> · Confidence ${formatPercent(detail.confidence)} · ${detail.finality}</p>`,
    "<p>Decision-support only. Review Required conditions and conflicting evidence must be checked before external use.</p>",
    `<p>${detail.rationale.map(escapeHtml).join(" ")}</p>`,
    `<p>Risk evidence: ${detail.conflictingEvidence.map(escapeHtml).join(" ")}</p>`,
    "<h2>Trade Timing</h2>",
    `<p>Entry Zone: ${formatPriceRange(detail.tradeTimingPlan.entryZone)}</p>`,
    `<p>Stop Level: ${formatPrice(detail.tradeTimingPlan.stopLevel)}</p>`,
    `<p>Target Zone: ${formatPriceRange(detail.tradeTimingPlan.targetZone)}</p>`,
    "</section>",
  ].join("");
}

function primaryChartPanel(
  panel: ChartPanel<{
    points: Array<{ date: string; close: number; volume: number }>;
    entryZone: { low: number; high: number };
    stopLevel: number;
    targetZone: { low: number; high: number };
    signalMarkers: Array<{ date: string; label: string; price: number }>;
  }>,
): string {
  if (panel.state === "unavailable") {
    return [
      '<section class="primary-chart-panel" aria-label="Primary chart">',
      "<h2>Price and Volume</h2>",
      `<p>${escapeHtml(panel.reason)}</p>`,
      "</section>",
    ].join("");
  }

  const latestPoint = panel.data.points.at(-1);
  const latestClose = latestPoint ? formatPrice(latestPoint.close) : "Unavailable";

  return [
    '<section class="primary-chart-panel" aria-label="Primary chart">',
    "<h2>Price and Volume</h2>",
    '<div class="chart-scroll">',
    `<p>Latest close: ${escapeHtml(latestClose)}</p>`,
    `<p>Entry Zone: ${formatPriceRange(panel.data.entryZone)}</p>`,
    `<p>Stop Level: ${formatPrice(panel.data.stopLevel)}</p>`,
    `<p>Target Zone: ${formatPriceRange(panel.data.targetZone)}</p>`,
    "</div>",
    "</section>",
  ].join("");
}

function panel(panelData: { id: ReportPanelId; title: string; rows: string[] }, active = false): string {
  return [
    `<section id="panel-${panelData.id}" class="report-panel${active ? " active" : ""}"><h3>${escapeHtml(panelData.title)}</h3>`,
    ...panelData.rows.map((row) => `<p>${escapeHtml(row)}</p>`),
    "</section>",
  ].join("");
}

function timing(
  actionLabel: ActionLabel,
  entryLow: number,
  entryHigh: number,
  stopLevel: number,
  targetLow: number,
  targetHigh: number,
): TradeTimingPlan {
  return {
    actionLabel,
    entryZone: { low: entryLow, high: entryHigh },
    stopLevel,
    targetZone: { low: targetLow, high: targetHigh },
    timeHorizon: "days_to_weeks",
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
