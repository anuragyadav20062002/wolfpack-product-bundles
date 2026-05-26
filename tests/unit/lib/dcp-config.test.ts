import { BundleType } from "../../../app/constants/bundle";
import { PRODUCT_PAGE_LAYOUT_BUNDLE_SETTING_ROWS } from "../../../app/lib/bundle-config/product-page-layout-settings";
import { getDCPConfig } from "../../../app/lib/dcp-config";

function getGeneralChildren(bundleType: BundleType) {
  const general = getDCPConfig(bundleType).find((group) => group.key === "general");
  return general?.children ?? [];
}

describe("Design Control Panel configuration", () => {
  it("adds cart messaging to product-page global defaults only", () => {
    expect(getGeneralChildren(BundleType.PRODUCT_PAGE)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "cartLineMessaging",
          label: "Cart Messaging",
        }),
      ])
    );

    expect(getGeneralChildren(BundleType.FULL_PAGE)).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "cartLineMessaging" }),
      ])
    );
  });

  it("keeps the observed product-page layout bundle settings as visual-only inventory", () => {
    expect(PRODUCT_PAGE_LAYOUT_BUNDLE_SETTING_ROWS).toEqual([
      { label: "Hide Out Of Stock Products", checked: true, visualOnly: true },
      { label: "Track inventory on Add To Cart (in beta)", checked: false, visualOnly: true },
      { label: "Add bundle to cart after the last step is completed", checked: false, visualOnly: true },
      { label: "Display empty state boxes based on bundle condition", checked: true, visualOnly: true },
      { label: "Hide Step Titles in completed state", checked: false, visualOnly: true },
      { label: "Add to cart when product card is clicked", checked: true, visualOnly: true },
      { label: "Redirect Collection Page 'Quick Add' to Bundle", checked: true, visualOnly: true },
    ]);
  });
});
