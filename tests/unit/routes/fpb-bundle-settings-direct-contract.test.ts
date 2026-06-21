import { readFpbConfigureRouteFamilySource } from "./fpb-configure-route-source";

describe("Full Page Bundle Settings direct contract", () => {
  it("submits Bundle Cart title and subtitle through bundleTextConfig", () => {
    const source = readFpbConfigureRouteFamilySource().replace(/\s+/g, " ");

    expect(source).toContain('formData.append( "bundleTextConfig"');
    expect(source).toContain("bundleSummary");
    expect(source).toContain("textOverrides.yourBundle");
    expect(source).toContain("textOverrides.reviewBundle");
  });

  it("does not render non-evidenced WPB-only display controls in Bundle Settings", () => {
    const source = readFpbConfigureRouteFamilySource();

    expect(source).not.toContain("Show product prices");
    expect(source).not.toContain("Show compare-at prices");
    expect(source).not.toContain("Allow quantity changes");
  });
});
