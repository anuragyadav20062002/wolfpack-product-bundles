import { getParentProductStatusUi } from "../../../app/lib/parent-product-status-ui";

describe("getParentProductStatusUi", () => {
  it.each([
    ["ACTIVE", "Active", "success", false],
    ["DRAFT", "Draft", "warning", false],
    ["ARCHIVED", "Archived", "warning", false],
    ["UNLISTED", "Unlisted", "warning", true],
  ])("maps Shopify %s to %s without fabricating unlisted state", (status, label, tone, showUnlistedBanner) => {
    expect(getParentProductStatusUi(status)).toEqual({
      label,
      tone,
      showUnlistedBanner,
    });
  });

  it("does not show the unlisted banner for missing product status", () => {
    expect(getParentProductStatusUi(null)).toEqual({
      label: "Unknown",
      tone: "warning",
      showUnlistedBanner: false,
    });
  });
});
