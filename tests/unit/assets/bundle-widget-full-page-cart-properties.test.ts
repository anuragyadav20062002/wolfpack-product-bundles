import { readFullPageWidgetSources } from './widget-source-helpers';
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Full Page widget cart display properties", () => {
  it("keeps compact source JSON while adding public cart line properties", () => {
    const source = readFullPageWidgetSources();
    const sharedCartLinesSource = readFileSync(
      join(process.cwd(), "app/assets/widgets/shared/engine/cart-lines.js"),
      "utf8",
    );

    expect(source).toContain("buildCartLineDisplayProperties(displayProperties)");
    expect(source).toContain("buildSharedCartLineDisplayProperties(displayProperties, this.getCartLineLabels())");
    expect(sharedCartLinesSource).toContain("Box: displayProperties.box || '1'");
    expect(sharedCartLinesSource).toContain("[cartLineLabels.items]: displayProperties.items");
    expect(sharedCartLinesSource).toContain("[cartLineLabels.retailPrice]: displayProperties.retailPrice");
    expect(sharedCartLinesSource).toContain("properties[cartLineLabels.youSave] = displayProperties.youSave.amountPercentage;");
    expect(sharedCartLinesSource).toContain("_bundle_display_properties: JSON.stringify(displayProperties)");
  });

  it("emits EB public bundle cart properties without step attribution", () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("Box: String(itemNumber)");
    expect(source).toContain("'_bundleName': bundleName");
    expect(source).toContain("'_wolfpackProductBundle:prodQty': String(quantity)");
    expect(source).toContain("'_wolfpackProductBundle:OfferId': `${offerId}_${sessionKey}_${itemNumber}`");
    expect(source).not.toContain("'_bundle_id': bundleInstanceId");
    expect(source).not.toContain("'_step_index'");
    expect(source).not.toContain("'_step_name'");
  });

  it("syncs EB bundle_details through the signed app proxy instead of direct Storefront GraphQL", () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("fetch('/apps/product-bundles/api/cart-bundle-details'");
    expect(source).toContain("bundleDetailsKey");
    expect(source).not.toContain("fetch(`/api/${version}/graphql.json`");
  });
});
