import { CurrencyManager } from "../../../app/assets/widgets/shared/currency-manager.js";

describe("CurrencyManager", () => {
  describe("normalizeCurrencyFormat", () => {
    it("replaces currency code with mapped symbol while preserving placeholder shape", () => {
      const output = CurrencyManager.normalizeCurrencyFormat(
        "PKR {{amount_with_comma_separator}}",
        "PKR",
        "Rs."
      );

      expect(output).toBe("Rs. {{amount_with_comma_separator}}");
    });

    it("replaces plain symbol-only codes in format", () => {
      const output = CurrencyManager.normalizeCurrencyFormat(
        "USD {{amount}}",
        "USD",
        "$"
      );

      expect(output).toBe("$ {{amount}}");
    });

    it("returns original format when symbol and code are the same", () => {
      const output = CurrencyManager.normalizeCurrencyFormat(
        "AED {{amount}}",
        "AED",
        "AED"
      );

      expect(output).toBe("AED {{amount}}");
    });

    it("falls back to `<symbol>{{amount}}` when no Shopify format is available", () => {
      const output = CurrencyManager.normalizeCurrencyFormat(
        null,
        "PKR",
        "Rs."
      );

      expect(output).toBe("Rs.{{amount}}");
    });
  });
});
