import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("full-page widget Step Config image contract", () => {
  const source = readFileSync(
    join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
    "utf8",
  );

  it("renders timeline icons from the runtime stepImage key", () => {
    expect(source).toContain("step.stepImage");
    expect(source).toContain(": step.stepImage;");
    expect(source).not.toContain("step.stepImage || step.timelineIconUrl");
  });
});
