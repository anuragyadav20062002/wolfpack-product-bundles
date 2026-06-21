import { readPpbConfigureRouteFamilySource } from "./ppb-configure-route-source";

describe("Product Page Bundle Widget default display mode", () => {
  it("defaults to the captured EB Offer Upsell Block state when no saved value exists", () => {
    const source = readPpbConfigureRouteFamilySource().replace(/\s+/g, " ");

    expect(source).toContain(
      'useState<string>((bundle as any).upsellWidgetDisplayMode ?? "block")',
    );
    expect(source).toContain(
      'useRef<string>( (bundle as any).upsellWidgetDisplayMode ?? "block"',
    );
    expect(source).not.toContain('upsellWidgetDisplayMode ?? "button"');
  });
});
