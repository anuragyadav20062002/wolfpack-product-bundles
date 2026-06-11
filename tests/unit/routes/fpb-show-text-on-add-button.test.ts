import fs from "node:fs";
import path from "node:path";

import { formatBundleForWidget } from "../../../app/lib/bundle-formatter.server";

const fpbRoute = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"),
  "utf8",
);

const fpbHandler = fs.readFileSync(
  path.join(process.cwd(), "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts"),
  "utf8",
);

describe("FPB Show Text on + Button persistence", () => {
  it("submits and persists the direct showTextOnAddButton field", () => {
    expect(fpbRoute).toContain("(bundle as any).showTextOnAddButton");
    expect(fpbRoute).toContain('formData.append("showTextOnAddButton", String(showTextOnPlusEnabled))');
    expect(fpbHandler).toContain('const showTextOnAddButton = formData.get("showTextOnAddButton") === "true"');
    expect(fpbHandler).toContain("showTextOnAddButton,");
  });

  it("emits showTextOnAddButton to the storefront payload without requiring button copy", () => {
    const result = formatBundleForWidget({
      id: "bundle-1",
      name: "Test Bundle",
      description: null,
      status: "ACTIVE",
      bundleType: "full_page",
      fullPageLayout: "FOOTER_BOTTOM",
      shopifyProductId: null,
      steps: [],
      pricing: null,
      showTextOnAddButton: true,
      textOverrides: null,
    } as any);

    expect(result.showTextOnAddButton).toBe(true);
    expect(result.textOverrides).toBeNull();
  });
});
