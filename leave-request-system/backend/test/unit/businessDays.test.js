import { describe, it, expect } from "vitest";
import { countBusinessDays } from "../../server/utils/businessDays.ts";

describe("countBusinessDays", () => {
  it("same day (Monday) = 1", () => {
    expect(
      countBusinessDays(new Date("2025-06-02"), new Date("2025-06-02")),
    ).toBe(1);
  });

  it("Mon to Fri = 5", () => {
    expect(
      countBusinessDays(new Date("2025-06-02"), new Date("2025-06-06")),
    ).toBe(5);
  });

  it("skips weekend: Fri to Mon = 2", () => {
    expect(
      countBusinessDays(new Date("2025-06-06"), new Date("2025-06-09")),
    ).toBe(2);
  });

  it("Mon to Mon spanning two weekends = 11", () => {
    expect(
      countBusinessDays(new Date("2025-06-02"), new Date("2025-06-16")),
    ).toBe(11);
  });

  it("weekend-only range (Sat to Sun) = 0", () => {
    expect(
      countBusinessDays(new Date("2025-06-07"), new Date("2025-06-08")),
    ).toBe(0);
  });
});
