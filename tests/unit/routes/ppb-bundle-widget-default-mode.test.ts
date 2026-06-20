import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Product Page Bundle Widget default display mode", () => {
  it("defaults to the captured EB Offer Upsell Block state when no saved value exists", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/ConfigureBundleFlow.tsx"),
      "utf8",
    );

    expect(source).toContain('useState<string>((bundle as any).upsellWidgetDisplayMode ?? "block")');
    expect(source).toContain('useRef<string>((bundle as any).upsellWidgetDisplayMode ?? "block")');
    expect(source).not.toContain('upsellWidgetDisplayMode ?? "button"');
  });
});
