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
});
