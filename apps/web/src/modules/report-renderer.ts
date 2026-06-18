import type { ClientReport } from "../domain/research";

export function renderReportHtml(report: ClientReport): string {
  const escapedTitle = escapeHtml(report.title);
  const renderedBody = renderMarkdownSubset(report.bodyMarkdown);
  return `<article><h1>${escapedTitle}</h1>${renderedBody}</article>`;
}

export function renderReportPdfBytes(report: ClientReport): Uint8Array {
  if (!report.approved) {
    throw new Error("Only approved Client Reports can be exported as PDF");
  }

  return new TextEncoder().encode(
    [
      "%PDF-1.4",
      "1 0 obj << /Type /Catalog >> endobj",
      renderReportHtml(report),
      "%%EOF",
    ].join("\n"),
  );
}

function renderMarkdownSubset(markdown: string): string {
  return markdown
    .split(/\n{2,}/)
    .map((block) => {
      if (block.startsWith("# ")) {
        return `<h1>${escapeHtml(block.slice(2))}</h1>`;
      }
      return `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
