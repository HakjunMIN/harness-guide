import { notFound } from "next/navigation";
import { parseInstrumentId, type InstrumentId } from "../../../src/domain/market";
import { buildResearchDetail, renderResearchDetailPage } from "../../../src/modules/research-detail";

export default async function SignalDetailPage({
  params,
}: {
  params: Promise<{ instrumentId: string }>;
}) {
  const { instrumentId: rawInstrumentId } = await params;
  let decodedInstrumentId: InstrumentId;
  try {
    decodedInstrumentId = decodeURIComponent(rawInstrumentId) as InstrumentId;
    parseInstrumentId(decodedInstrumentId);
  } catch {
    notFound();
  }
  const detail = buildResearchDetail(decodedInstrumentId);
  const html = renderResearchDetailPage(detail);

  return <main dangerouslySetInnerHTML={{ __html: html }} />;
}
