import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbTimelineSettings({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    activeTabIndex,
    bundle,
    bundleBannerDesktopUrl,
    bundleBannerMobileUrl,
    DiscountMethod,
    FilePicker,
    markAsDirty,
    pricingState,
    setBundleBannerDesktopUrl,
    setBundleBannerMobileUrl,
    stepsState,
  } = flow;
  const settingsStep = stepsState.steps[activeTabIndex] || stepsState.steps[0];
  const individualSellingPlanBlocked =
    pricingState.discountType === DiscountMethod.BUY_X_GET_Y;

  return (
    <>
      <s-section>
        <s-stack direction="block" gap="small">
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            Bundle Banner
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
            Upload banner images for desktop and mobile views that will be
            displayed at the top of your bundle page.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Banner Image: Desktop
              </p>
              {bundleBannerDesktopUrl ? (
                <div
                  style={{
                    position: "relative",
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid #c9cccf",
                  }}
                >
                  <img
                    src={bundleBannerDesktopUrl}
                    alt="Banner Image: Desktop"
                    style={{
                      width: "100%",
                      display: "block",
                      maxHeight: 180,
                      objectFit: "cover",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBundleBannerDesktopUrl("");
                      markAsDirty();
                    }}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "#fff",
                      border: "1px solid #c9cccf",
                      borderRadius: 4,
                      cursor: "pointer",
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: "#d72c0d",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <FilePicker
                  value={null}
                  onChange={(url) => {
                    setBundleBannerDesktopUrl(url ?? "");
                    markAsDirty();
                  }}
                />
              )}
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 12,
                  color: "#6d7175",
                }}
              >
                Recommended Size:
                <span style={{ color: "#202223" }}>1900x230</span>
              </p>
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Banner Image: Mobile
              </p>
              {bundleBannerMobileUrl ? (
                <div
                  style={{
                    position: "relative",
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid #c9cccf",
                  }}
                >
                  <img
                    src={bundleBannerMobileUrl}
                    alt="Banner Image: Mobile"
                    style={{
                      width: "100%",
                      display: "block",
                      maxHeight: 180,
                      objectFit: "cover",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBundleBannerMobileUrl("");
                      markAsDirty();
                    }}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "#fff",
                      border: "1px solid #c9cccf",
                      borderRadius: 4,
                      cursor: "pointer",
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: "#d72c0d",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <FilePicker
                  value={null}
                  onChange={(url) => {
                    setBundleBannerMobileUrl(url ?? "");
                    markAsDirty();
                  }}
                />
              )}
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 12,
                  color: "#6d7175",
                }}
              >
                Recommended Size:
                <span style={{ color: "#202223" }}>1100x500</span>
              </p>
            </div>
          </div>
        </s-stack>
      </s-section>
    </>
  );
}
