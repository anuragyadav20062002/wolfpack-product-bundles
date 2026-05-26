import fs from "node:fs";
import path from "node:path";

describe("BundleStatusSection", () => {
  it("uses the Polaris select value contract so status changes serialize", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/routes/app/_shared/bundle-configure/BundleStatusSection.tsx"),
      "utf8"
    );

    expect(source).toContain("value={status}");
    expect(source).toContain("<s-option");
    expect(source).not.toContain("<option ");
  });
});
