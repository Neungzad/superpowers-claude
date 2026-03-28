import { describe, it, expect } from "vitest";
import { validateBalance } from "../../server/utils/validation.ts";

describe("validateBalance", () => {
  it("returns null when requested equals remaining", () => {
    expect(validateBalance(5, 5)).toBeNull();
  });

  it("returns null when requested is less than remaining", () => {
    expect(validateBalance(3, 10)).toBeNull();
  });

  it("returns error string when requested exceeds remaining", () => {
    const result = validateBalance(5, 3);
    expect(result).toMatch(/Insufficient leave balance/);
    expect(result).toMatch(/Remaining: 3/);
    expect(result).toMatch(/Requested: 5/);
  });

  it("returns error when remaining is zero", () => {
    const result = validateBalance(1, 0);
    expect(result).toMatch(/Insufficient leave balance/);
  });
});
