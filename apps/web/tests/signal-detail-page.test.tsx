import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SignalDetailPage from "../app/signals/[instrumentId]/page";

Object.assign(globalThis, { React });

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

describe("Signal detail route", () => {
  it("returns not found for malformed encoded InstrumentIds", async () => {
    await expect(
      SignalDetailPage({ params: Promise.resolve({ instrumentId: "%E0%A4%A" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders Research visualizations from the Recharts route integration", async () => {
    const page = await SignalDetailPage({
      params: Promise.resolve({ instrumentId: encodeURIComponent("US:XNAS:NVDA") }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Research visualizations");
    expect(html).toContain("Technical Indicators");
    expect(html).toContain("Signal Contribution");
    expect(html).toContain("Price and Volume");
  });
});
