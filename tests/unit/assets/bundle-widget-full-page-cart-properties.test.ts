import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Full Page widget cart display properties", () => {
  it("keeps compact source JSON while adding public cart line properties", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );

    expect(source).toContain("buildCartLineDisplayProperties(displayProperties)");
    expect(source).toContain("Box: displayProperties.box || '1'");
    expect(source).toContain("Items: displayProperties.items");
    expect(source).toContain("'Retail Price': displayProperties.retailPrice");
    expect(source).toContain("properties['You Save'] = displayProperties.youSave.amountPercentage;");
    expect(source).toContain("'_bundle_display_properties': JSON.stringify(displayProperties)");
  });

  it("emits EB public bundle cart properties without step attribution", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );

    expect(source).toContain("Box: String(itemNumber)");
    expect(source).toContain("'_bundleName': bundleName");
    expect(source).toContain("'_easyBundle:prodQty': String(quantity)");
    expect(source).toContain("'_easyBundle:OfferId': `${offerId}_${sessionKey}_${itemNumber}`");
    expect(source).toContain("'_bundle_id': bundleInstanceId");
    expect(source).not.toContain("'_step_index'");
    expect(source).not.toContain("'_step_name'");
  });

  it("syncs EB bundle_details through the signed app proxy instead of direct Storefront GraphQL", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );

    expect(source).toContain("fetch('/apps/product-bundles/api/cart-bundle-details'");
    expect(source).toContain("bundleDetailsKey");
    expect(source).not.toContain("fetch(`/api/${version}/graphql.json`");
  });
});
