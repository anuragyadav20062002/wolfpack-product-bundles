/**
 * UI contract for the discount rule row layout (gray box) in FPB + PPB.
 *
 * Issue: feedback-jun26-4
 * Spec : test-spec/discount-rule-row.spec.md
 */
import fs from "node:fs";
import path from "node:path";

const cssPath = path.join(
  process.cwd(),
  "app/styles/routes/bundle-configure-shared.module.css"
);
const css = fs.readFileSync(cssPath, "utf8");

const fpbPath = path.join(
  process.cwd(),
  "app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx"
);
const fpb = fs.readFileSync(fpbPath, "utf8");

const ppbPath = path.join(
  process.cwd(),
  "app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx"
);
const ppb = fs.readFileSync(ppbPath, "utf8");

function extractRule(source: string, selector: string): string {
  const index = source.indexOf(selector + " {");
  if (index === -1) return "";
  const start = source.indexOf("{", index);
  const end = source.indexOf("}", start);
  if (start === -1 || end === -1) return "";
  return source.slice(start + 1, end);
}

function discountBlock(source: string): string {
  // Anchor on the discount rule card render — that's where the gray box lives.
  // Slice forward 8000 chars to cover both ternary branches in FPB and the
  // two separate trees (BXY vs non-BXY) in PPB.
  const start = source.indexOf("className={fullPageBundleStyles.discountRuleCard");
  const startPpb = source.indexOf("className={productPageBundleStyles.discountRuleCard");
  const anchor = start !== -1 ? start : startPpb;
  if (anchor === -1) return "";
  return source.slice(anchor, anchor + 8000);
}

describe("CSS contract: discount rule row layout", () => {
  const row = extractRule(css, ".discountFieldsRow");
  const pair = extractRule(css, ".discountFieldsRowPair");

  it("declares .discountFieldsRow as a 3-column grid", () => {
    expect(row).toMatch(/display:\s*grid/);
    expect(row).toMatch(/grid-template-columns:\s*1fr\s+1fr\s+1fr/);
  });

  it("aligns .discountFieldsRow fields to the baseline", () => {
    expect(row).toMatch(/align-items:\s*end/);
  });

  it("declares a gap on .discountFieldsRow", () => {
    const match = row.match(/gap:\s*(\d+)px/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(8);
  });

  it("declares .discountFieldsRowPair as a 2-column grid", () => {
    expect(pair).toMatch(/display:\s*grid/);
    expect(pair).toMatch(/grid-template-columns:\s*1fr\s+1fr/);
  });

  it("collapses both classes to a single column under 700px", () => {
    const collapsed = css.indexOf("@media (max-width: 700px)");
    expect(collapsed).toBeGreaterThan(-1);
    const slice = css.slice(collapsed, collapsed + 600);
    expect(slice).toContain(".discountFieldsRow");
    expect(slice).toContain(".discountFieldsRowPair");
    expect(slice).toMatch(/grid-template-columns:\s*1fr/);
  });
});

describe("JSX contract: FPB discount rule body uses grid classes", () => {
  const block = discountBlock(fpb);

  it("uses .discountFieldsRowPair inside the FIXED_BUNDLE_PRICE branch", () => {
    const fixedBundle = block.indexOf("DiscountMethod.FIXED_BUNDLE_PRICE");
    expect(fixedBundle).toBeGreaterThan(-1);
    const inBranch = block.slice(fixedBundle, fixedBundle + 1500);
    expect(inBranch).toContain("discountFieldsRowPair");
  });

  it("uses .discountFieldsRow inside the PERCENTAGE_OFF / FIXED_AMOUNT_OFF branch", () => {
    expect(block).toContain("discountFieldsRow");
  });

  it("does not retain s-stack direction=inline inside the discount rule body", () => {
    expect(block).not.toMatch(/<s-stack[^>]*direction="inline"/);
  });
});

describe("JSX contract: PPB discount rule body uses grid classes", () => {
  const block = discountBlock(ppb);

  it("uses .discountFieldsRowPair inside the FIXED_BUNDLE_PRICE branch", () => {
    const fixedBundle = block.indexOf("DiscountMethod.FIXED_BUNDLE_PRICE");
    expect(fixedBundle).toBeGreaterThan(-1);
    const inBranch = block.slice(fixedBundle, fixedBundle + 1500);
    expect(inBranch).toContain("discountFieldsRowPair");
  });

  it("uses .discountFieldsRow inside the PERCENTAGE_OFF / FIXED_AMOUNT_OFF branch", () => {
    expect(block).toContain("discountFieldsRow");
  });

  it("does not retain s-stack direction=inline inside the discount rule body", () => {
    expect(block).not.toMatch(/<s-stack[^>]*direction="inline"/);
  });
});
