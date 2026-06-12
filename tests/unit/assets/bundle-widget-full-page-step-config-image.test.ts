import { readFullPageWidgetSources } from './widget-source-helpers';

describe("full-page widget Step Config image contract", () => {
  const source = readFullPageWidgetSources();

  it("renders timeline icons from the runtime stepImage key", () => {
    expect(source).toContain("step.stepImage");
    expect(source).toContain(": step.stepImage;");
    expect(source).not.toContain("step.stepImage || step.timelineIconUrl");
  });
});
