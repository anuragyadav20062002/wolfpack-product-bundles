import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Full Page Bundle Widget button text default", () => {
  it("defaults to the captured EB widget button text while preserving saved values", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
      "utf8",
    );

    expect(source).toContain('savedWidgetConfiguration?.buttonText ?? textOverrides.widgetButtonText ?? "Save More With Bundle"');
    expect(source).toContain('savedWidgetConfiguration?.buttonText ?? (bundle as any).textOverrides?.widgetButtonText ?? "Save More With Bundle"');
    expect(source).not.toContain('"Buy with Bundle"');
  });
});
