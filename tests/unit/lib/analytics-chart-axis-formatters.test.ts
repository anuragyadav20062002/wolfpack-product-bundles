import {
  formatCompactCountAxisTick,
  formatCompactCurrencyAxisTick,
} from "../../../app/lib/analytics/chart-axis-formatters";

describe("analytics chart axis formatters", () => {
  it("formats engagement count values for compact chart ticks", () => {
    expect(formatCompactCountAxisTick(0)).toBe("0");
    expect(formatCompactCountAxisTick(34)).toBe("34");
    expect(formatCompactCountAxisTick(1200)).toBe("1.2K");
    expect(formatCompactCountAxisTick(1500000)).toBe("1.5M");
  });

  it("formats bundle revenue cents for compact chart ticks", () => {
    expect(formatCompactCurrencyAxisTick(0)).toBe("$0");
    expect(formatCompactCurrencyAxisTick(999)).toBe("$10");
    expect(formatCompactCurrencyAxisTick(125000)).toBe("$1.3K");
    expect(formatCompactCurrencyAxisTick(150000000)).toBe("$1.5M");
  });
});
