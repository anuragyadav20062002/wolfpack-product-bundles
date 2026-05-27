import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Full Page widget template layout contract", () => {
  it("uses the side-footer layout when the saved FPB template is side-footer", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );

    expect(source).toContain("resolveFullPageLayout()");
    expect(source).toContain("bundle?.bundleDesignTemplate === 'FBP_SIDE_FOOTER'");
    expect(source).toContain("return 'footer_side';");
    expect(source).toContain("const layout = this.resolveFullPageLayout();");
  });

  it("marks side-footer storefront DOM with the saved FPB design preset", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );

    expect(source).toContain("getFullPageDesignPreset()");
    expect(source).toContain(
      "this.elements.stepsContainer.dataset.fpbDesignPreset = this.getFullPageDesignPreset();",
    );
  });

  it("includes horizontal preset CSS for the evidenced FPB card and layout rules", () => {
    const css = readFileSync(
      join(
        process.cwd(),
        "app/assets/widgets/full-page-css/bundle-widget-full-page.css",
      ),
      "utf8",
    );

    expect(css).toContain('.layout-sidebar[data-fpb-design-preset="HORIZONTAL"]');
    expect(css).toContain("grid-template-columns:0.65fr 0.35fr");
    expect(css).toContain("grid-template-columns:repeat(2,");
    expect(css).toContain("grid-template-columns:minmax(120px,0.3fr) minmax(0,0.7fr)");
    expect(css).toContain("grid-template-columns:1fr");
  });

  it("renders FPB product-card add buttons with the evidenced text label", () => {
    const source = readFileSync(
      join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
      "utf8",
    );
    const componentGenerator = readFileSync(
      join(process.cwd(), "app/assets/widgets/shared/component-generator.js"),
      "utf8",
    );

    expect(source).toContain("getProductAddButtonText()");
    expect(source).toContain(": this.getProductAddButtonText()");
    expect(source).toContain("addButton.textContent = this.getProductAddButtonText();");
    expect(source).toContain("addButtonText: this.getProductAddButtonText()");
    expect(componentGenerator).toContain("const addButtonText = options.addButtonText || '+';");
    expect(componentGenerator).toContain("${this.escapeHtml(addButtonText)}");
  });

  it("includes compact horizontal mobile card CSS with rectangular card CTAs", () => {
    const css = readFileSync(
      join(
        process.cwd(),
        "app/assets/widgets/full-page-css/bundle-widget-full-page.css",
      ),
      "utf8",
    );

    expect(css).toContain(".layout-sidebar .product-add-btn");
    expect(css).toContain("height:36px");
    expect(css).toContain("border-radius:5px");
    expect(css).toContain("box-shadow:none");
    expect(css).toContain('.layout-sidebar[data-fpb-design-preset="HORIZONTAL"] .sidebar-content .product-add-btn');
    expect(css).toContain("grid-template-columns:112px minmax(0,1fr)");
    expect(css).toContain("min-height:112px");
    expect(css).toContain("height:100px");
  });
});
