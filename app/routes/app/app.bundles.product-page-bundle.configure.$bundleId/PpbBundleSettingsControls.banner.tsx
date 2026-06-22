import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbBundleBannerSettings() {
  const {
    bundleBannerDesktopUrl,
    bundleBannerMobileUrl,
    FilePicker,
    markAsDirty,
    setBundleBannerDesktopUrl,
    setBundleBannerMobileUrl,
  } = usePpbConfigureContext();

  return (
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
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 500 }}>
              Banner Image: Desktop
            </p>
            <FilePicker
              value={bundleBannerDesktopUrl || null}
              onChange={(url) => {
                setBundleBannerDesktopUrl(url ?? "");
                markAsDirty();
              }}
            />
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6d7175" }}>
              Recommended Size:
              <span style={{ color: "#202223" }}>1900x230</span>
            </p>
          </div>
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 500 }}>
              Banner Image: Mobile
            </p>
            <FilePicker
              value={bundleBannerMobileUrl || null}
              onChange={(url) => {
                setBundleBannerMobileUrl(url ?? "");
                markAsDirty();
              }}
            />
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6d7175" }}>
              Recommended Size:
              <span style={{ color: "#202223" }}>1100x500</span>
            </p>
          </div>
        </div>
      </s-stack>
    </s-section>
  );
}
