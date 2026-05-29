/**
 * Tests for the pure helper that backs useEnablePreviewGate.
 *
 * Issue: feedback-jun26-10
 * Spec : test-spec/enable-preview-gate.spec.md
 */
import { decideEnablePreviewGate } from "../../../app/hooks/useEnablePreviewGate";

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
