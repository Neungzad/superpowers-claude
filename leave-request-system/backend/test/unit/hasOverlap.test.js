import { describe, it, expect } from "vitest";
import { hasOverlap } from "../../server/utils/validation.ts";

const existing = [
  { start_date: "2025-06-10", end_date: "2025-06-12", status: "PENDING" },
  { start_date: "2025-06-20", end_date: "2025-06-22", status: "APPROVED" },
  { start_date: "2025-06-25", end_date: "2025-06-26", status: "REJECTED" },
];

describe("hasOverlap", () => {
  it("returns false for range before all existing", () => {
    expect(
      hasOverlap(new Date("2025-06-01"), new Date("2025-06-05"), existing),
    ).toBe(false);
  });

  it("returns false for range after all existing", () => {
    expect(
      hasOverlap(new Date("2025-07-01"), new Date("2025-07-05"), existing),
    ).toBe(false);
  });

  it("returns false for adjacent range (no overlap)", () => {
    expect(
      hasOverlap(new Date("2025-06-01"), new Date("2025-06-09"), existing),
    ).toBe(false);
  });

  it("returns true when overlapping a PENDING request", () => {
    expect(
      hasOverlap(new Date("2025-06-11"), new Date("2025-06-15"), existing),
    ).toBe(true);
  });

  it("returns true when overlapping an APPROVED request", () => {
    expect(
      hasOverlap(new Date("2025-06-18"), new Date("2025-06-21"), existing),
    ).toBe(true);
  });

  it("returns false for overlap with REJECTED only (ignored)", () => {
    expect(
      hasOverlap(new Date("2025-06-25"), new Date("2025-06-26"), existing),
    ).toBe(false);
  });

  it("returns false for empty existing list", () => {
    expect(hasOverlap(new Date("2025-06-10"), new Date("2025-06-12"), [])).toBe(
      false,
    );
  });
});
