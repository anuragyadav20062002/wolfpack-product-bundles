import fs from "node:fs";
import path from "node:path";

const designSettingsApiSource = fs.readFileSync(
  path.join(process.cwd(), "app/routes/api/api.design-settings.$shopDomain.tsx"),
  "utf8",
);

describe("Design Settings storefront fallback defaults", () => {
  it("uses EB Product Page corner defaults when no design settings row exists", () => {
    expect(designSettingsApiSource).toContain("productCardBorderRadius: 10");
    expect(designSettingsApiSource).toContain("productImageBorderRadius: 8");
    expect(designSettingsApiSource).toContain("buttonBorderRadius: 5");
  });
});
