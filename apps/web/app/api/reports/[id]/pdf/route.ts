import { NextResponse } from "next/server";
import { renderReportPdfBytes } from "../../../../../src/modules/report-renderer";

export async function POST(request: Request) {
  const report = await request.json();
  const bytes = renderReportPdfBytes(report);
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);

  return new NextResponse(body, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${report.id}.pdf"`,
    },
  });
}
