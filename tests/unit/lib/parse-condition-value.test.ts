/**
 * Unit tests for parseConditionValue.
 *
 * Issue: feedback-jun26-8
 */
import { parseConditionValue } from "../../../app/lib/parse-condition-value";

describe("parseConditionValue", () => {
  it("preserves 0 instead of dropping to null", () => {
    expect(parseConditionValue("0")).toBe(0);
    expect(parseConditionValue(0)).toBe(0);
  });

  it("parses positive integers", () => {
    expect(parseConditionValue("3")).toBe(3);
    expect(parseConditionValue(7)).toBe(7);
  });

  it("parses decimals", () => {
    expect(parseConditionValue("2.5")).toBe(2.5);
  });

  it("trims whitespace", () => {
    expect(parseConditionValue("  4  ")).toBe(4);
  });

  it("returns null for empty string", () => {
    expect(parseConditionValue("")).toBeNull();
    expect(parseConditionValue("   ")).toBeNull();
  });

  it("returns null for null / undefined", () => {
    expect(parseConditionValue(null)).toBeNull();
    expect(parseConditionValue(undefined)).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(parseConditionValue("abc")).toBeNull();
    expect(parseConditionValue("3abc")).toBeNull();
  });
});
