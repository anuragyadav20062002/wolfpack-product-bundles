/**
 * Unit tests for bundle preview readiness persistence.
 *
 * Spec : test-spec/bundle-preview-readiness.spec.md
 */
import {
  getPreviewReadinessStorageKey,
  markBundlePreviewComplete,
} from "../../../app/lib/bundle-preview-readiness";

describe("bundle preview readiness", () => {
  it("builds the existing preview readiness storage key", () => {
    expect(getPreviewReadinessStorageKey("bundle-1")).toBe(
      "wpb_preview_bundle-1",
    );
  });

  it("persists preview completion and updates in-memory state", () => {
    const setItem = jest.fn();
    const setHasPreview = jest.fn();

    markBundlePreviewComplete({
      bundleId: "bundle-1",
      storage: { setItem } as unknown as Storage,
      setHasPreview,
    });

    expect(setItem).toHaveBeenCalledWith("wpb_preview_bundle-1", "1");
    expect(setHasPreview).toHaveBeenCalledWith(true);
  });

  it("still updates in-memory state when storage is unavailable", () => {
    const setHasPreview = jest.fn();

    expect(() =>
      markBundlePreviewComplete({
        bundleId: "bundle-1",
        storage: {
          setItem: () => {
            throw new Error("blocked");
          },
        } as unknown as Storage,
        setHasPreview,
      }),
    ).not.toThrow();

    expect(setHasPreview).toHaveBeenCalledWith(true);
  });
});
