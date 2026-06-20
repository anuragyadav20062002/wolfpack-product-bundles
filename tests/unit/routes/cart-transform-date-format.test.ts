import { formatCartTransformDate } from "../../../app/routes/app/app.bundles.cart-transform/date-format";

describe("formatCartTransformDate", () => {
  it("formats cart transform dates deterministically across server and browser locales", () => {
    expect(formatCartTransformDate("2026-06-05T18:30:00.000Z")).toBe("6/5/2026");
  });

  it("returns an empty string for missing or invalid dates", () => {
    expect(formatCartTransformDate(null)).toBe("");
    expect(formatCartTransformDate("not-a-date")).toBe("");
  });
});
