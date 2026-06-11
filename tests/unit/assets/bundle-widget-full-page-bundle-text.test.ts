import { readFullPageWidgetSources } from './widget-source-helpers';
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Full Page widget bundle summary text contract", () => {
  it("renders the direct bundleTextConfig bundle summary title and subtitle", () => {
    const source = readFullPageWidgetSources();

    expect(source).toContain("getBundleSummaryText()");
    expect(source).toContain("this.selectedBundle?.bundleTextConfig?.bundleSummary");
    expect(source).toContain("summaryText.title");
    expect(source).toContain("summaryText.subTitle");
  });

  it("renders saved step subtext in the Full Page content body without the search box", () => {
    const source = readFullPageWidgetSources();
    const css = readFileSync(
      join(
        process.cwd(),
        "app/assets/widgets/full-page-css/base/part-02.css",
      ),
      "utf8",
    );

    expect(source).toContain("getCurrentStepContentText(stepIndex)");
    expect(source).toContain("createStepContentHeader(this.currentStepIndex)");
    expect(source).toContain("step.pageTitle");
    expect(source).toContain("fpb-step-subtext");
    expect(source).toContain("fpb-full-page-content-header");
    expect(source).toContain("shouldRenderFullPageSearch()");
    expect(source).toContain("if (this.shouldRenderFullPageSearch())");
    expect(css).toContain(".fpb-full-page-content-header");
    expect(css).toContain(".fpb-step-subtext");
  });
});
