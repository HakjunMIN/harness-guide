import React from "react";
import { notFound } from "next/navigation";
import { parseInstrumentId, type InstrumentId } from "../../../src/domain/market";
import { buildResearchDetail, parseReportPanelId, renderResearchDetailPage } from "../../../src/modules/research-detail";
import { ResearchChartsClient } from "./research-charts-client";

export default async function SignalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ instrumentId: string }>;
  searchParams: Promise<{ panel?: string | string[] }>;
}) {
  const { instrumentId: rawInstrumentId } = await params;
  const { panel } = await searchParams;
  let decodedInstrumentId: InstrumentId;
  try {
    decodedInstrumentId = decodeURIComponent(rawInstrumentId) as InstrumentId;
    parseInstrumentId(decodedInstrumentId);
  } catch {
    notFound();
  }
  const detail = buildResearchDetail(decodedInstrumentId);
  const panelValue = Array.isArray(panel) ? panel[0] : panel;
  const html = renderResearchDetailPage(detail, { selectedPanel: parseReportPanelId(panelValue) });

  return (
    <main>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <ResearchChartsClient charts={detail.charts} />
    </main>
  );
}
