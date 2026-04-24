import { BlockStack, InlineStack, Text, Divider, TextField, Button, Collapsible, Box, Banner } from "@shopify/polaris";
import type { SettingsComponentProps } from "./types";

interface CustomCssSettingsProps extends SettingsComponentProps {
  customCssHelpOpen: boolean;
  setCustomCssHelpOpen: (open: boolean) => void;
}

/** Monospace code chip for a single class / variable name */
function Chip({ label }: { label: string }) {
  return (
    <code
      style={{
        display: "inline-block",
        background: "#f0f4ff",
        color: "#3d3d8f",
        borderRadius: 4,
        padding: "1px 6px",
        fontSize: 11,
        fontFamily: "monospace",
        marginRight: 4,
        marginBottom: 4,
        border: "1px solid #d4d9f5",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </code>
  );
}

/** One labelled group of chips */
function RefGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <BlockStack gap="100">
      <Text as="p" variant="bodySm" fontWeight="semibold">
        {title}
      </Text>
      <div style={{ lineHeight: 1.8 }}>
        {items.map((item) => (
          <Chip key={item} label={item} />
        ))}
      </div>
    </BlockStack>
  );
}

/**
 * Custom CSS Settings Panel
 * Allows users to add custom CSS rules for advanced customization
 */
export function CustomCssSettings({
  settings,
  onUpdate,
  customCssHelpOpen,
  setCustomCssHelpOpen,
}: CustomCssSettingsProps) {
  return (
    <BlockStack gap="400">
      <InlineStack gap="200" align="start" blockAlign="center">
        <Text as="h2" variant="headingMd">
          Custom CSS
        </Text>
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            border: "1.5px solid #8A8A8A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 600,
            color: "#4A4A4A",
            cursor: "help",
          }}
          title="Add custom CSS rules to further customize your bundle widget appearance"
        >
          i
        </div>
      </InlineStack>
      <Text as="p" variant="bodyMd" tone="subdued">
        Add your own CSS rules to customize the bundle widget beyond the available settings.
      </Text>
      <Divider />

      <BlockStack gap="300">
        <TextField
          label="Custom CSS Rules"
          value={settings.customCss}
          onChange={(value) => onUpdate("customCss", value)}
          multiline={8}
          autoComplete="off"
          placeholder={`.product-card {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.product-add-btn:hover {
  transform: scale(1.02);
}

/* Override a CSS variable */
#bundle-builder-app {
  --bundle-product-card-border-radius: 12px;
}`}
          helpText={`${settings.customCss.length.toLocaleString()} / 50,000 characters`}
        />

        <Button
          onClick={() => setCustomCssHelpOpen(!customCssHelpOpen)}
          variant="plain"
          disclosure={customCssHelpOpen ? "up" : "down"}
        >
          View CSS Class Reference
        </Button>

        <Collapsible open={customCssHelpOpen} id="custom-css-help">
          <Box padding="400" background="bg-surface-secondary" borderRadius="200">
            <BlockStack gap="400">
              <Text as="p" variant="headingSm">
                CSS Classes — Shared (Both Widget Types)
              </Text>

              <RefGroup
                title="Widget Container"
                items={["#bundle-builder-app", ".bundle-widget-full-page", ".bundle-header", ".bundle-title", ".bundle-description"]}
              />
              <RefGroup
                title="Product Cards"
                items={[".product-card", ".product-image", ".product-title", ".product-price", ".product-price-strike", ".product-add-btn", ".selected-overlay", ".product-content-wrapper"]}
              />
              <RefGroup
                title="Quantity & Variants"
                items={[".product-quantity-wrapper", ".qty-display", ".qty-btn", ".qty-decrease", ".qty-increase", ".variant-selector", ".variant-selector-wrapper"]}
              />
              <RefGroup
                title="Search"
                items={[".step-search-input-wrapper", ".step-search-input", ".step-search-clear"]}
              />
              <RefGroup
                title="Promo Banner"
                items={[".promo-banner", ".promo-banner-title", ".promo-banner-subtitle", ".promo-banner-note"]}
              />
              <RefGroup
                title="Loading"
                items={[".bundle-loading-overlay", ".bundle-loading-overlay__gif", ".skeleton-loading", ".skeleton-card-content"]}
              />

              <Divider />
              <Text as="p" variant="headingSm">
                Product-Page Widget (Modal / Drawer)
              </Text>

              <RefGroup
                title="Modal Structure"
                items={[".modal-overlay", ".modal-content", ".modal-header", ".modal-step-title", ".close-button", ".modal-body"]}
              />
              <RefGroup
                title="Step Tabs"
                items={[".modal-tabs-wrapper", ".modal-tabs", ".tab-arrow-left", ".tab-arrow-right", ".tab-check", ".tab-name", ".tab-number", ".tab-count", ".tab-lock", ".tab-locked-tooltip"]}
              />
              <RefGroup
                title="Footer"
                items={[".modal-footer", ".modal-footer-grouped-content", ".modal-footer-total-pill", ".total-price-strike", ".total-price-final", ".cart-badge-wrapper", ".cart-badge-count", ".modal-footer-discount-messaging", ".footer-discount-text", ".modal-footer-buttons-row", ".modal-nav-button", ".next-button", ".prev-button"]}
              />

              <Divider />
              <Text as="p" variant="headingSm">
                Full-Page Widget
              </Text>

              <RefGroup
                title="Step Timeline Tabs"
                items={[".step-tabs-container", ".step-tab", ".step-box", ".step-name", ".step-selection-count", ".step-clear-badge", ".step-images", ".step-image"]}
              />
              <RefGroup
                title="Category Tabs"
                items={[".category-tabs", ".category-tab"]}
              />
              <RefGroup
                title="Content & Grid"
                items={[".full-page-content-section", ".full-page-product-grid", ".full-page-product-grid-container", ".inline-qty-btn", ".inline-qty-display"]}
              />
              <RefGroup
                title="Sidebar (Sidebar Layout)"
                items={[".sidebar-layout-wrapper", ".full-page-side-panel", ".sidebar-content", ".side-panel-header", ".side-panel-title", ".side-panel-products", ".side-panel-product-row", ".side-panel-product-remove", ".side-panel-action-container", ".side-panel-total", ".side-panel-discount-message", ".side-panel-btn-next", ".side-panel-clear-btn"]}
              />
              <RefGroup
                title="Footer (Footer Layout)"
                items={[".full-page-footer", ".footer-nav-section", ".footer-btn-back", ".footer-btn-next", ".footer-progress-section", ".footer-total-section", ".footer-products-tiles-wrapper", ".footer-product-tile", ".tile-image", ".tile-product-name", ".tile-quantity-badge", ".tile-remove", ".footer-discount-message"]}
              />
              <RefGroup
                title="Variant Breakdown Popup"
                items={[".variant-breakdown-overlay", ".variant-breakdown-popup", ".variant-breakdown-header", ".variant-breakdown-list", ".variant-breakdown-item", ".add-another-variant-btn", ".remove-variant-btn", ".close-breakdown-btn"]}
              />

              <Divider />
              <Text as="p" variant="headingSm">
                CSS Variables (override via <code style={{ fontSize: 11 }}>#bundle-builder-app {"{ … }"}</code>)
              </Text>

              <RefGroup
                title="Global"
                items={["--bundle-global-primary-button", "--bundle-global-primary-text", "--bundle-global-secondary-text", "--bundle-bg-color", "--bundle-drawer-bg"]}
              />
              <RefGroup
                title="Product Cards"
                items={["--bundle-product-card-bg", "--bundle-product-card-border-radius", "--bundle-product-card-shadow", "--bundle-product-card-hover-shadow", "--bundle-product-card-font-color", "--bundle-product-card-font-size", "--bundle-product-image-border-radius", "--bundle-product-image-height"]}
              />
              <RefGroup
                title="Buttons"
                items={["--bundle-button-bg", "--bundle-button-text-color", "--bundle-button-border-radius", "--bundle-button-hover-bg", "--bundle-add-to-cart-button-bg", "--bundle-add-to-cart-button-text", "--bundle-add-to-cart-button-radius"]}
              />
              <RefGroup
                title="Footer"
                items={["--bundle-footer-bg", "--bundle-footer-padding", "--bundle-footer-border-radius", "--bundle-footer-next-button-bg", "--bundle-footer-next-button-text", "--bundle-footer-next-button-border", "--bundle-footer-next-button-radius", "--bundle-footer-back-button-bg", "--bundle-footer-back-button-text", "--bundle-footer-final-price-color", "--bundle-footer-strike-price-color", "--bundle-footer-total-bg"]}
              />
              <RefGroup
                title="Step Timeline"
                items={["--bundle-step-timeline-circle-bg", "--bundle-step-timeline-circle-text-color", "--bundle-step-timeline-line-color", "--bundle-step-timeline-line-completed", "--bundle-step-timeline-name-color", "--bundle-step-timeline-name-font-size", "--bundle-completed-step-bg-color", "--bundle-completed-step-checkmark-color"]}
              />
              <RefGroup
                title="Promo Banner"
                items={["--bundle-promo-banner-bg", "--bundle-promo-banner-padding", "--bundle-promo-banner-radius", "--bundle-promo-banner-title-color", "--bundle-promo-banner-title-font-size", "--bundle-promo-banner-subtitle-color"]}
              />
              <RefGroup
                title="Discount Messaging"
                items={["--bundle-discount-text-color", "--bundle-discount-text-font-size", "--bundle-discount-pill-bg", "--bundle-discount-pill-text", "--bundle-success-message-bg-color", "--bundle-success-message-text-color", "--bundle-footer-discount-display"]}
              />

              <Banner tone="warning">
                <Text as="p" variant="bodySm">
                  For security, JavaScript URLs, <code>@import</code> rules, and other potentially
                  harmful patterns are automatically removed.
                </Text>
              </Banner>
            </BlockStack>
          </Box>
        </Collapsible>
      </BlockStack>
    </BlockStack>
  );
}
