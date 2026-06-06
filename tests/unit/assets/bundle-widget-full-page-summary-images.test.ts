import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
  "utf8",
);

describe("full-page selected product summary images", () => {
  it("normalizes selected product image sources before rendering summary slots", () => {
    expect(source).toContain("_getSelectedProductImageSrc(item)");
    expect(source).toContain("const imgSrc = this._getSelectedProductImageSrc(item);");
    expect(source).toContain("item.variantImage?.src");
    expect(source).toContain("typeof item.image === 'string'");
    expect(source).toContain("item.image?.src");
    expect(source).toContain("item.featuredImage?.url");
  });

  it("uses the same selected image source resolver across desktop, mobile, and footer summaries", () => {
    const resolverCalls = source.match(/this\._getSelectedProductImageSrc\(item\)/g) || [];

    expect(resolverCalls.length).toBeGreaterThanOrEqual(4);
    expect(source).not.toContain("const imgSrc = item.image || item.imageUrl || '';");
    expect(source).not.toContain('src="${item.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE}"');
    expect(source).not.toContain("img.src = item.imageUrl || BUNDLE_WIDGET.PLACEHOLDER_IMAGE;");
  });

  it("removes the trailing exclamation mark from sidebar discount prompts", () => {
    expect(source).toContain("_formatSidebarDiscountMessage(discountMessage)");
    expect(source).toContain("discountMessage = this._formatSidebarDiscountMessage(discountMessage);");
    expect(source).toContain("message.replace(/!+\\s*$/, '')");
  });
});
