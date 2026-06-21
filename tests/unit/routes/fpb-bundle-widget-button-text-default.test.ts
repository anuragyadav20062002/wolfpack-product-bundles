import { readFpbConfigureRouteFamilySource } from "./fpb-configure-route-source";

describe("Full Page Bundle Widget button text default", () => {
  it("defaults to the captured EB widget button text while preserving saved values", () => {
    const source = readFpbConfigureRouteFamilySource().replace(/\s+/g, " ");

    expect(source).toContain(
      'savedWidgetConfiguration?.buttonText ?? textOverrides.widgetButtonText ?? "Save More With Bundle"',
    );
    expect(source).toContain(
      'savedWidgetConfiguration?.buttonText ?? (bundle as any).textOverrides?.widgetButtonText ?? "Save More With Bundle"',
    );
    expect(source).not.toContain('"Buy with Bundle"');
  });
});
