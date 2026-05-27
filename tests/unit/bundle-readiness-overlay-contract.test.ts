import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "app/components/bundle-configure/BundleReadinessOverlay.tsx"),
  "utf8",
);

describe("BundleReadinessOverlay interaction contract", () => {
  it("renders readiness rows as buttons and keeps existing layout class", () => {
    expect(source).toContain("<button");
    expect(source).toContain("styles.panelItem");
    expect(source).toContain("onKeyDown={(event) => handleItemKeyDown(event, item.key)}");
  });

  it("supports Enter and Space activation", () => {
    expect(source).toContain('if (event.key === "Enter" || event.key === " ")');
    expect(source).toContain("activateItem(item.key);");
  });

  it("makes collapsed trigger keyboard accessible", () => {
    expect(source).toContain('type="button"');
    expect(source).toContain('data-tour-target="fpb-readiness-score"');
    expect(source).toContain('aria-label="Toggle readiness score"');
  });
});
