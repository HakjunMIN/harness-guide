import { describe, expect, it, vi } from "vitest";
import SignalDetailPage from "../app/signals/[instrumentId]/page";

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
});
