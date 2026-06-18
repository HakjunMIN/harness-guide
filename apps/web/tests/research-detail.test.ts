import { describe, expect, it } from "vitest";
import { buildResearchDetail, renderResearchDetailPage } from "../src/modules/research-detail";

describe("Research Detail", () => {
  it("renders fixed summary and tabbed Research Report Panels", () => {
    const html = renderResearchDetailPage(buildResearchDetail("US:XNAS:NVDA"));

    expect(html).toContain("Signal Brief");
    expect(html).toContain("Trade Timing");
    expect(html).toContain("command-bar");
    expect(html).toContain("fixed-summary");
    expect(html).toContain("Report tabs");
    expect(html).toContain("segmented-tabs");
    expect(html).toContain("Evidence Panel");
    expect(html).toContain(">Technical</a>");
    expect(html).toContain(">AI Context</a>");
    expect(html).toContain(">Portfolio</a>");
    expect(html).toContain(">Backtest</a>");
    expect(html).toContain(">Risk</a>");
    expect(html).toContain(">Audit</a>");
    expect(html).toContain(">Research Actions</a>");
  });

  it("pairs strong Action Labels with decision-support copy and risk evidence", () => {
    const html = renderResearchDetailPage(buildResearchDetail("US:XNAS:NVDA"));
    const signalBrief = sectionBetween(html, "<h2>Signal Brief</h2>", "<h2>Trade Timing</h2>");

    expect(html).toContain("BUY");
    expect(html).toContain("action-badge action-buy");
    expect(html).toContain("Confidence 88%");
    expect(html).toContain("Entry Zone: 118 - 124");
    expect(html).toContain("Decision-support only");
    expect(html).toContain("Review Required conditions");
    expect(signalBrief).toContain("High volatility requires disciplined entry and stop monitoring.");
  });

  it("formats AI contribution and haircut as percentages in the AI Context Report Panel", () => {
    const html = renderResearchDetailPage(buildResearchDetail("US:XNAS:NVDA"));
    const aiHtml = renderResearchDetailPage(buildResearchDetail("US:XNAS:NVDA"), { selectedPanel: "ai-context" });
    const aiContextPanel = sectionBetween(aiHtml, "AI Context Report Panel", "</section></section>");

    expect(aiContextPanel).toContain("AI contribution: 42%");
    expect(aiContextPanel).toContain("AI Weight Haircut: 6%");
    expect(aiContextPanel).not.toContain("0.42");
    expect(aiContextPanel).not.toContain("0.06");
  });

  it("renders the primary chart after Trade Timing and before report tabs", () => {
    const html = renderResearchDetailPage(buildResearchDetail("US:XNAS:NVDA"));
    const tradeTimingIndex = html.indexOf("<h2>Trade Timing</h2>");
    const primaryChartIndex = html.indexOf('class="primary-chart-panel"');
    const reportTabsIndex = html.indexOf('class="report-tabs"');

    expect(primaryChartIndex).toBeGreaterThan(tradeTimingIndex);
    expect(primaryChartIndex).toBeLessThan(reportTabsIndex);
    expect(sectionBetween(html, 'class="primary-chart-panel"', 'class="report-tabs"')).toContain("Price and Volume");
    expect(sectionBetween(html, 'class="primary-chart-panel"', 'class="report-tabs"')).toContain("chart-scroll");
  });

  it("marks Portfolio Impact unavailable without making portfolio claims", () => {
    const html = renderResearchDetailPage(buildResearchDetail("US:XNAS:NVDA", { portfolioAvailable: false }), {
      selectedPanel: "portfolio",
    });

    expect(html).toContain("Portfolio Impact Report Panel");
    expect(html).toContain("Portfolio unavailable; portfolio-specific claims are not shown.");
  });

  it("shows insufficient backtest sample as review-required", () => {
    const detail = buildResearchDetail("KR:XKRX:000830");
    const html = renderResearchDetailPage(detail, { selectedPanel: "backtest" });

    expect(detail.actionLabel).toBe("REVIEW_REQUIRED");
    expect(detail.tradeTimingPlan.actionLabel).toBe("REVIEW_REQUIRED");
    expect(html).toContain("Insufficient backtest sample for this instrument.");
    expect(html).toContain("Review required before interpreting performance support.");
  });

  it("marks portfolio exposure chart unavailable when Portfolio is unavailable", () => {
    const detail = buildResearchDetail("US:XNAS:NVDA", { portfolioAvailable: false });

    expect(detail.charts.portfolioExposure).toEqual({
      state: "unavailable",
      reason: "Portfolio unavailable; portfolio-specific claims are not shown.",
    });
  });

  function sectionBetween(html: string, start: string, end: string): string {
    const startIndex = html.indexOf(start);
    const endIndex = html.indexOf(end, startIndex + start.length);

    expect(startIndex).toBeGreaterThanOrEqual(0);
    expect(endIndex).toBeGreaterThan(startIndex);

    return html.slice(startIndex, endIndex);
  }

  it("renders Samsung Electronics detail for search cards that link to 005930", () => {
    const detail = buildResearchDetail("KR:XKRX:005930");
    const html = renderResearchDetailPage(detail);

    expect(detail.displayName).toBe("Samsung Electronics");
    expect(html).toContain("Samsung Electronics Research Detail");
    expect(html).toContain("HOLD");
    expect(html).not.toContain("NVIDIA Research Detail");
    expect(html).not.toContain("Unsupported instrument");
    expect(detail.charts.priceVolume.state).toBe("available");
  });

  it("renders report tabs as interactive controls and only shows the selected panel by default", () => {
    const html = renderResearchDetailPage(buildResearchDetail("US:XNAS:NVDA"));

    expect(html).toContain('<a class="tab-chip active" href="?panel=evidence" aria-current="page">Evidence</a>');
    expect(html).toContain('<a class="tab-chip" href="?panel=technical">Technical</a>');
    expect(html).not.toContain("<span class=\"tab-chip\">Evidence</span>");
    expect(html).toContain('<section id="panel-evidence" class="report-panel active">');
    expect(html).not.toContain("Technical Report Panel</h3>");
    expect(html).not.toContain("Portfolio Impact Report Panel</h3>");
  });
});
