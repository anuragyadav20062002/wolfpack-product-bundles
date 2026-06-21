import type React from "react";
import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbImagesGifsSection() {
  const {
    activeAssetTabIndex,
    activeSection,
    FilePicker,
    loadingGif,
    markAsDirty,
    productPageBundleStyles,
    setActiveAssetTabIndex,
    setLoadingGif,
    stepsState,
  } = usePpbConfigureContext();

  return (
    <>
      {activeSection === "images_gifs" && (
        <div data-tour-target="ppb-design-settings">
          <s-stack direction="block" gap="base">
            <div
              style={{
                padding: "var(--s-space-400)",
                background: "#f6f6f7",
                borderRadius: 8,
              }}
            >
              <s-stack direction="inline" gap="small-100" alignItems="center">
                <s-icon type="upload" />
                <s-stack direction="block">
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                    Media Assets
                  </p>
                  <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                    Add visual media to enhance the bundle experience for
                    shoppers.
                  </p>
                </s-stack>
              </s-stack>
            </div>
            {stepsState.steps.length > 0 && (
              <s-section>
                <s-stack direction="block" gap="base">
                  <s-stack direction="inline">
                    <s-stack direction="inline" gap="small" inlineSize="100%">
                      <s-icon type="upload" />
                      <s-stack direction="block" gap="small-400">
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                          Step Images
                        </p>
                        <p
                          style={{ margin: 0, fontSize: 12, color: "#6d7175" }}
                        >
                          Banner image per step — shown above the step's
                          products in the widget
                        </p>
                      </s-stack>
                    </s-stack>
                    <s-badge tone="info">Per step</s-badge>
                  </s-stack>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        borderBottom: "1.5px solid #e5e7eb",
                        marginBottom: 16,
                        gap: 0,
                      }}
                    >
                      {stepsState.steps.map((step, i) => (
                        <button
                          key={`asset-step-${step.id}`}
                          onClick={() => setActiveAssetTabIndex(i)}
                          style={{
                            padding: "10px 0",
                            marginRight: 24,
                            fontSize: 14,
                            fontWeight: activeAssetTabIndex === i ? 600 : 500,
                            color:
                              activeAssetTabIndex === i ? "#1a1a1a" : "#6b7280",
                            cursor: "pointer",
                            borderBottom:
                              activeAssetTabIndex === i
                                ? "2px solid #1a1a1a"
                                : "2px solid transparent",
                            marginBottom: -1.5,
                            background: "none",
                            border: "none",
                            borderBottomStyle: "solid",
                            borderBottomWidth: 2,
                            borderBottomColor:
                              activeAssetTabIndex === i
                                ? "#1a1a1a"
                                : "transparent",
                          }}
                        >
                          {step.name || `Step ${i + 1}`}
                        </button>
                      ))}
                    </div>
                  </div>
                  {stepsState.steps.map(
                    (step, index) =>
                      activeAssetTabIndex === index && (
                        <s-stack key={step.id} direction="block" gap="base">
                          <s-stack direction="block" gap="small-100">
                            <s-stack direction="block" gap="small-400">
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 14,
                                  fontWeight: 600,
                                }}
                              >
                                Step Banner Image
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 12,
                                  color: "#6d7175",
                                }}
                              >
                                Full-width image shown above this step's
                                products. Recommended: 1600 × 400 px.
                              </p>
                            </s-stack>
                            <FilePicker
                              label="Choose banner image"
                              value={(step as any).bannerImageUrl ?? null}
                              onChange={(url) => {
                                stepsState.updateStepField(
                                  step.id,
                                  "bannerImageUrl",
                                  url ?? null,
                                );
                                markAsDirty();
                              }}
                            />
                          </s-stack>
                        </s-stack>
                      ),
                  )}
                </s-stack>
              </s-section>
            )}
            <s-section>
              <s-stack direction="block" gap="base">
                <s-stack
                  direction="inline"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <s-stack direction="inline" gap="small" alignItems="center">
                    <s-icon type="clock" />
                    <s-stack direction="block" gap="small-400">
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                        Loading Animation
                      </p>
                      <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>
                        Overlay shown while bundle content is loading
                      </p>
                    </s-stack>
                  </s-stack>
                  <span title="This setting controls the loading animation visible to shoppers on your storefront">
                    <s-badge tone="info">Storefront</s-badge>
                  </span>
                </s-stack>
                <div
                  style={{
                    padding: "var(--s-space-400)",
                    background: "#f6f6f7",
                    borderRadius: 8,
                  }}
                >
                  <s-stack direction="inline" gap="large">
                    <s-stack direction="block" gap="small-400">
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#6d7175",
                        }}
                      >
                        FORMAT
                      </p>
                      <p style={{ margin: 0, fontSize: 14 }}>GIF only</p>
                    </s-stack>
                    <s-stack direction="block" gap="small-400">
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#6d7175",
                        }}
                      >
                        RECOMMENDED SIZE
                      </p>
                      <p style={{ margin: 0, fontSize: 14 }}>
                        Max 150 × 150 px
                      </p>
                    </s-stack>
                  </s-stack>
                </div>
                <s-divider />
                <FilePicker
                  label="Choose loading GIF"
                  value={loadingGif}
                  onChange={(url) => {
                    setLoadingGif(url);
                    markAsDirty();
                  }}
                />
                <s-stack direction="block" gap="small-100">
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#6d7175",
                    }}
                  >
                    PREVIEW
                  </p>
                  <div
                    className={productPageBundleStyles.loadingAnimationPreview}
                    role="img"
                    aria-label={
                      loadingGif
                        ? "Loading animation preview"
                        : "Default loading spinner preview"
                    }
                  >
                    {loadingGif ? (
                      <img src={loadingGif} alt="" />
                    ) : (
                      <span
                        className={
                          productPageBundleStyles.loadingAnimationPreviewSpinner
                        }
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </s-stack>
              </s-stack>
            </s-section>
          </s-stack>
        </div>
      )}
    </>
  );
}
