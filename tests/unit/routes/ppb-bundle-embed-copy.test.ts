import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Product Page Bundle Embed copy", () => {
  it("matches captured EB Bundle Embed placement copy", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/ConfigureBundleFlow.tsx"),
      "utf8",
    );

    expect(source).toContain("Embed Bundle Builder on Product Pages");
    expect(source).toContain("Directly embed the Bundle Builder block on product pages so customers can curate bundles there.");
    expect(source).toContain("Put the Bundle Builder at a custom location");
    expect(source).toContain("Place app block on the theme");
    expect(source).toContain("Place Block");
  });

  it("renders the Bundle Embed Multi Language action as visible text", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/ConfigureBundleFlow.tsx"),
      "utf8",
    );

    const embedSectionIndex = source.indexOf('data-tour-target="ppb-bundle-embed"');
    const modalIndex = source.indexOf('openMultiLanguageModal("Bundle Embed"', embedSectionIndex);
    const visibleTextIndex = source.indexOf("Multi Language", modalIndex);
    const titleFieldIndex = source.indexOf("<span>Title</span>", visibleTextIndex);

    expect(embedSectionIndex).toBeGreaterThan(-1);
    expect(modalIndex).toBeGreaterThan(embedSectionIndex);
    expect(visibleTextIndex).toBeGreaterThan(modalIndex);
    expect(titleFieldIndex).toBeGreaterThan(visibleTextIndex);
  });

  it("preserves the captured Bundle Embed default title and save payload shape", () => {
    const source = readFileSync(
      join(process.cwd(), "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/ConfigureBundleFlow.tsx"),
      "utf8",
    );

    expect(source).toContain('savedUpsellConfiguration?.title ?? textOverrides.embedTitle ?? "Build Your Bundle & Save More"');
    expect(source).toContain('savedUpsellConfiguration?.subTitle ?? textOverrides.embedSubTitle ?? ""');
    expect(source).toContain("upsellConfiguration: {");
    expect(source).toContain("title: bundleEmbedTitle");
    expect(source).toContain("subTitle: bundleEmbedSubTitle");
    expect(source).toContain("useLinkProductAsDefaultProduct: bundleEmbedAddBrowsedProduct");
  });
});
