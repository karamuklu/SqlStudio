import { describe, expect, it } from "vitest";
import { numericFilter } from "./result-filter";

describe("numericFilter", () => {
  it("supports comparison operators", () => {
    expect(numericFilter(18450, ">1000")).toBe(true);
    expect(numericFilter(980, ">1000")).toBe(false);
    expect(numericFilter(1000, ">=1000")).toBe(true);
  });

  it("supports exact and decimal values", () => {
    expect(numericFilter(12.5, "12,5")).toBe(true);
    expect(numericFilter(12.5, "=12.4")).toBe(false);
  });
});
