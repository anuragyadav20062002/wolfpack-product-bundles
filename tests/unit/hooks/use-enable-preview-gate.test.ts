/**
 * Tests for the pure helpers that back useEnablePreviewGate.
 *
 * Issue: feedback-jun26-10
 * Spec : test-spec/enable-preview-gate.spec.md
 */
import { decideEnablePreviewGate, shouldAutoShowOnMount } from "../../../app/hooks/useEnablePreviewGate";

describe("decideEnablePreviewGate", () => {
  it("proceeds when the app embed is enabled", () => {
    expect(decideEnablePreviewGate({ appEmbedEnabled: true, themeEditorUrl: "x" }))
      .toEqual({ mode: "proceed" });
  });

  it("proceeds even when themeEditorUrl is missing as long as embed is enabled", () => {
    expect(decideEnablePreviewGate({ appEmbedEnabled: true, themeEditorUrl: null }))
      .toEqual({ mode: "proceed" });
  });

  it("blocks with modal when embed is disabled and we have a theme editor URL", () => {
    expect(decideEnablePreviewGate({ appEmbedEnabled: false, themeEditorUrl: "x" }))
      .toEqual({ mode: "block_with_modal" });
  });

  it("blocks silently when embed is disabled and we have no theme editor URL", () => {
    expect(decideEnablePreviewGate({ appEmbedEnabled: false, themeEditorUrl: null }))
      .toEqual({ mode: "block_silent" });
  });
});

describe("shouldAutoShowOnMount", () => {
  it("returns true when bundle visibility is pending and modal has not been shown this session", () => {
    expect(shouldAutoShowOnMount(true, false)).toBe(true);
  });

  it("returns false when bundle visibility is not pending", () => {
    expect(shouldAutoShowOnMount(false, false)).toBe(false);
    expect(shouldAutoShowOnMount(false, true)).toBe(false);
  });

  it("returns false when modal has already been shown this session", () => {
    expect(shouldAutoShowOnMount(true, true)).toBe(false);
  });
});
