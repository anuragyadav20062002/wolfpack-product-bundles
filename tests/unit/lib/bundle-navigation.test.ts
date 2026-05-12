import { getBundleWizardConfigurePath } from "../../../app/lib/bundle-navigation";

describe("bundle navigation helpers", () => {
  it("builds the unified create/configure wizard path for editing bundles", () => {
    expect(getBundleWizardConfigurePath("bundle-123")).toBe(
      "/app/bundles/create/configure/bundle-123"
    );
  });
});
