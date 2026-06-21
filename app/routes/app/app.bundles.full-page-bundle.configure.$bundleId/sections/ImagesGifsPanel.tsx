import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbImagesGifsPanel({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    activeAssetTabIndex,
    activeSection,
    bundle,
    FilePicker,
    floatingBadgeEnabled,
    floatingBadgeText,
    fullPageBundleStyles,
    loadingGif,
    markAsDirty,
    promoBannerBgImage,
    RichHelpTooltip,
    setActiveAssetTabIndex,
    setFloatingBadgeEnabled,
    setFloatingBadgeText,
    setLoadingGif,
    setPromoBannerBgImage,
    stepsState,
  } = flow;

  return (
    <>
      {activeSection === "images_gifs" && (
        <>
          <div
            style={{
              padding: "var(--s-space-400)",
              background: "var(--s-color-bg-surface-secondary, #f6f6f7)",
              borderRadius: 8,
            }}
          >
            <s-stack direction="inline" gap="small-100">
              <s-icon type="upload" />
              <s-stack direction="block">
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                  Media Assets
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                  Add visual media to enhance the bundle experience for
                  shoppers.
                </p>
              </s-stack>
            </s-stack>
          </div>
          <s-section>
            <s-stack direction="block" gap="base">
              <s-stack direction="inline">
                <s-stack direction="inline" gap="small" inlineSize="100%">
                  <s-icon type="upload" />
                  <s-stack direction="block" gap="small-400">
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                      Promo Banner
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "#6d7175",
                      }}
                    >
                      Wide banner displayed at the top of the full-page bundle
                    </p>
                  </s-stack>
                </s-stack>
                <s-badge tone="info">Page header</s-badge>
              </s-stack>
              <div
                style={{
                  padding: "var(--s-space-400)",
                  background: "var(--s-color-bg-surface-secondary, #f6f6f7)",
                  borderRadius: 8,
                }}
              >
                <s-stack direction="inline" gap="large">
                  <s-stack direction="block" gap="small-400">
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#6d7175",
                      }}
                    >
                      FORMAT
                    </p>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      JPG, PNG, WebP, GIF, SVG, AVIF
                    </p>
                  </s-stack>
                  <s-stack direction="block" gap="small-400">
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#6d7175",
                      }}
                    >
                      RECOMMENDED SIZE
                    </p>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      1600 × 400 px · 4:1 ratio
                    </p>
                  </s-stack>
                </s-stack>
              </div>
              <s-divider />
              <FilePicker
                value={promoBannerBgImage}
                onChange={(url) => {
                  setPromoBannerBgImage(url);
                  markAsDirty();
                }}
              />
            </s-stack>
          </s-section>
          {stepsState.steps.length > 0 && (
            <s-section>
              <s-stack direction="block" gap="base">
                <s-stack direction="inline">
                  <s-stack direction="inline" gap="small" inlineSize="100%">
                    <s-icon type="upload" />
                    <s-stack direction="block" gap="small-400">
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        Step Images
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "#6d7175",
                        }}
                      >
                        Tab icon and banner image per step — shown in the widget
                      </p>
                    </s-stack>
                  </s-stack>
                  <s-badge tone="info">Per step</s-badge>
                </s-stack>
                <div>
                  <div className={fullPageBundleStyles.tabRow}>
                    {stepsState.steps.map((step, i) => (
                      <button
                        key={`asset-step-${step.id}`}
                        onClick={() => setActiveAssetTabIndex(i)}
                        className={
                          activeAssetTabIndex === i
                            ? fullPageBundleStyles.tabActive
                            : fullPageBundleStyles.tab
                        }
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
                              Tab Icon
                            </p>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 12,
                                color: "#6d7175",
                              }}
                            >
                              Circular icon in the step tab. Replaces the step
                              number when set. Recommended: 100 × 100 px square.
                            </p>
                          </s-stack>
                          <FilePicker
                            label="Choose tab icon"
                            value={(step as any).imageUrl ?? null}
                            onChange={(url) => {
                              stepsState.updateStepField(
                                step.id,
                                "imageUrl",
                                url ?? null,
                              );
                              markAsDirty();
                            }}
                          />
                        </s-stack>
                        <s-divider />
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
                              Full-width image above the product grid when this
                              step is active. Recommended: 1600 × 400 px.
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
              <s-stack direction="inline">
                <s-stack direction="inline" gap="small" inlineSize="100%">
                  <s-icon type="clock" />
                  <s-stack direction="block" gap="small-400">
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                      Loading Animation
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "#6d7175",
                      }}
                    >
                      Overlay shown while bundle content is loading
                    </p>
                  </s-stack>
                </s-stack>
                <RichHelpTooltip
                  label="Storefront"
                  tooltipKey="loadingAnimation"
                />
              </s-stack>
              <div
                style={{
                  padding: "var(--s-space-400)",
                  background: "var(--s-color-bg-surface-secondary, #f6f6f7)",
                  borderRadius: 8,
                }}
              >
                <s-stack direction="inline" gap="large">
                  <s-stack direction="block" gap="small-400">
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
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
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#6d7175",
                      }}
                    >
                      RECOMMENDED SIZE
                    </p>
                    <p style={{ margin: 0, fontSize: 14 }}>Max 150 × 150 px</p>
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
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6d7175",
                  }}
                >
                  PREVIEW
                </p>
                <div
                  className={fullPageBundleStyles.loadingAnimationPreview}
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
                        fullPageBundleStyles.loadingAnimationPreviewSpinner
                      }
                      aria-hidden="true"
                    />
                  )}
                </div>
              </s-stack>
            </s-stack>
          </s-section>
          <s-section>
            <s-stack direction="block" gap="base">
              <s-stack direction="inline">
                <s-stack direction="inline" gap="small" inlineSize="100%">
                  <s-icon type="note" />
                  <s-stack direction="block" gap="small-400">
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                      Floating Promo Badge
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "#6d7175",
                      }}
                    >
                      Fixed badge at bottom-left of the page — session-dismissed
                      when shopper clicks X
                    </p>
                  </s-stack>
                </s-stack>
                <s-badge tone="info">Storefront</s-badge>
              </s-stack>
              <s-checkbox
                label="Show floating promo badge"
                checked={floatingBadgeEnabled || undefined}
                onChange={(e) => {
                  setFloatingBadgeEnabled(
                    (e.target as HTMLInputElement).checked,
                  );
                  markAsDirty();
                }}
              />
              {floatingBadgeEnabled && (
                <s-text-field
                  label="Badge text"
                  value={floatingBadgeText}
                  onInput={(e) => {
                    setFloatingBadgeText(
                      (e.target as HTMLInputElement).value.slice(0, 60),
                    );
                    markAsDirty();
                  }}
                  placeholder="e.g. Save 20% today only!"
                  autocomplete="off"
                />
              )}
            </s-stack>
          </s-section>
        </>
      )}
    </>
  );
}
