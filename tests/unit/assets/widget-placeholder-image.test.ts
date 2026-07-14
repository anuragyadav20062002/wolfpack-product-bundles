import { BUNDLE_WIDGET } from "../../../app/assets/widgets/shared/constants.js";

describe("SharedWidgetPlaceholder", () => {
  it.each([
    ["primary", BUNDLE_WIDGET.PLACEHOLDER_IMAGE],
    ["fallback", BUNDLE_WIDGET.PLACEHOLDER_IMAGE_FALLBACK],
  ])("provides a self-contained %s image", (_label, imageUrl) => {
    expect(imageUrl).toMatch(/^data:image\/svg\+xml,/);

    const decoded = decodeURIComponent(imageUrl.split(",", 2)[1]);
    expect(decoded).toContain('viewBox="0 0 400 400"');
    expect(decoded).toContain('fill="#f3f4f6"');
  });
});
