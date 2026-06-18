import { describe, expect, it } from "vitest";
import { renderReportHtml, renderReportPdfBytes } from "../src/modules/report-renderer";

describe("ReportRenderer", () => {
  it("renders HTML preview and PDF bytes from an approved Client Report", () => {
    const report = {
      id: "report-1",
      title: "Client Report",
      bodyMarkdown: "# Client Report\n\nApproved commentary.",
      approved: true,
    };

    expect(renderReportHtml(report)).toContain("<h1>Client Report</h1>");
    expect(renderReportPdfBytes(report).byteLength).toBeGreaterThan(10);
  });

  it("blocks PDF export for reports still awaiting approval", () => {
    const report = {
      id: "report-1",
      title: "Client Report",
      bodyMarkdown: "# Client Report\n\nDraft commentary.",
      approved: false,
    };

    expect(() => renderReportPdfBytes(report)).toThrow("Only approved Client Reports can be exported as PDF");
  });
});
