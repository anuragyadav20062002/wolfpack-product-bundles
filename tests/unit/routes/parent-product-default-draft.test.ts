import fs from "node:fs";
import path from "node:path";

const fpbHandlerSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/handlers/handlers.server.ts",
  ),
  "utf8",
);

const ppbHandlerSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts",
  ),
  "utf8",
);

describe("bundle parent product default status", () => {
  it("creates FPB parent products as draft by default", () => {
    expect(fpbHandlerSource).toContain('status: "DRAFT",');
    expect(fpbHandlerSource).toContain("status: 'DRAFT',");
    expect(fpbHandlerSource).not.toContain('status: "ACTIVE",\n          descriptionHtml: bundle.description || ');
    expect(fpbHandlerSource).not.toContain("status: 'ACTIVE',\n              descriptionHtml: bundle.description || ");
  });

  it("creates PPB parent products as draft by default while preserving explicit unlisted sync", () => {
    expect(ppbHandlerSource).toContain('status: "DRAFT",');
    expect(ppbHandlerSource).toContain("status: 'DRAFT',");
    expect(ppbHandlerSource).not.toContain('status: "ACTIVE",\n          descriptionHtml: buildBundleProductDescriptionHtml');
    expect(ppbHandlerSource).not.toContain("status: 'ACTIVE',\n          descriptionHtml: buildBundleProductDescriptionHtml");
    expect(ppbHandlerSource).toContain('status: "UNLISTED"');
  });
});
