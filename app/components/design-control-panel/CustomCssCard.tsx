/**
 * Custom CSS Card Component
 *
 * Provides a custom CSS editor with an up-to-date reference of CSS classes
 * and CSS variables available in both widget types.
 */

import {
  Text,
  BlockStack,
  InlineStack,
  TextField,
  Button,
  Collapsible,
  Box,
  Banner,
  Card,
  Layout,
  Divider,
} from "@shopify/polaris";

interface CustomCssCardProps {
  customCss: string;
  onCustomCssChange: (value: string) => void;
  customCssHelpOpen: boolean;
  onToggleHelp: () => void;
  onSave: () => void;
  isLoading: boolean;
}

/** Inline monospace chip */
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

/** One labelled group rendered in a compact grid column */
function RefGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <BlockStack gap="100">
      <Text as="p" variant="bodySm" fontWeight="semibold">
        {title}
      </Text>
      <div style={{ lineHeight: 1.9 }}>
        {items.map((item) => (
          <Chip key={item} label={item} />
        ))}
      </div>
    </BlockStack>
  );
}

/** Section heading inside the reference panel */
function SectionHead({ label }: { label: string }) {
  return (
    <Text as="p" variant="headingSm">
      {label}
    </Text>
  );
}

export function CustomCssCard({
  customCss,
  onCustomCssChange,
  customCssHelpOpen,
  onToggleHelp,
  onSave,
  isLoading,
}: CustomCssCardProps) {
  return (
    <Layout>
      <Layout.Section>
        <Card>
          <BlockStack gap="400">
            {/* ── Header ── */}
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  Custom CSS
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Add your own CSS rules to customize the bundle widget beyond the visual editor settings.
                </Text>
              </BlockStack>
              <Button
                onClick={onToggleHelp}
                variant="plain"
                disclosure={customCssHelpOpen ? "up" : "down"}
              >
                CSS Reference
              </Button>
            </InlineStack>

            {/* ── Reference Panel ── */}
            <Collapsible open={customCssHelpOpen} id="custom-css-help-main">
              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="500">

                  {/* ── Shared classes ── */}
                  <SectionHead label="Shared Classes (Both Widget Types)" />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: 16,
                    }}
                  >
                    <RefGroup
                      title="Widget Container"
                      items={[
                        "#bundle-builder-app",
                        ".bundle-widget-full-page",
                        ".bundle-header",
                        ".bundle-title",
                        ".bundle-description",
                      ]}
                    />
                    <RefGroup
                      title="Product Cards"
                      items={[
                        ".product-card",
                        ".product-image",
                        ".product-title",
                        ".product-price",
                        ".product-price-strike",
                        ".product-add-btn",
                        ".selected-overlay",
                        ".product-content-wrapper",
                      ]}
                    />
                    <RefGroup
                      title="Quantity & Variants"
                      items={[
                        ".product-quantity-wrapper",
                        ".qty-display",
                        ".qty-btn",
                        ".qty-decrease",
                        ".qty-increase",
                        ".variant-selector",
                        ".variant-selector-wrapper",
                      ]}
                    />
                    <RefGroup
                      title="Search Bar"
                      items={[
                        ".step-search-input-wrapper",
                        ".step-search-input",
                        ".step-search-clear",
                      ]}
                    />
                    <RefGroup
                      title="Promo Banner"
                      items={[
                        ".promo-banner",
                        ".promo-banner-title",
                        ".promo-banner-subtitle",
                        ".promo-banner-note",
                      ]}
                    />
                    <RefGroup
                      title="Loading States"
                      items={[
                        ".bundle-loading-overlay",
                        ".bundle-loading-overlay__gif",
                        ".skeleton-loading",
                        ".skeleton-card-content",
                      ]}
                    />
                  </div>

                  <Divider />

                  {/* ── Product-page modal ── */}
                  <SectionHead label="Product-Page Widget (Modal / Drawer)" />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: 16,
                    }}
                  >
                    <RefGroup
                      title="Modal Structure"
                      items={[
                        ".modal-overlay",
                        ".modal-content",
                        ".modal-header",
                        ".modal-step-title",
                        ".close-button",
                        ".modal-body",
                      ]}
                    />
                    <RefGroup
                      title="Step Tabs"
                      items={[
                        ".modal-tabs-wrapper",
                        ".modal-tabs",
                        ".tab-arrow-left",
                        ".tab-arrow-right",
                        ".tab-check",
                        ".tab-name",
                        ".tab-number",
                        ".tab-count",
                        ".tab-lock",
                        ".tab-locked-tooltip",
                        ".tab-product-image",
                      ]}
                    />
                    <RefGroup
                      title="Footer Bar"
                      items={[
                        ".modal-footer",
                        ".modal-footer-grouped-content",
                        ".modal-footer-total-pill",
                        ".total-price-strike",
                        ".total-price-final",
                        ".price-cart-separator",
                        ".cart-badge-wrapper",
                        ".cart-badge-count",
                        ".cart-icon",
                      ]}
                    />
                    <RefGroup
                      title="Footer Discount & Nav"
                      items={[
                        ".modal-footer-discount-messaging",
                        ".footer-discount-text",
                        ".modal-footer-buttons-row",
                        ".modal-nav-button",
                        ".next-button",
                        ".prev-button",
                      ]}
                    />
                  </div>

                  <Divider />

                  {/* ── Full-page widget ── */}
                  <SectionHead label="Full-Page Widget" />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: 16,
                    }}
                  >
                    <RefGroup
                      title="Step Timeline Tabs"
                      items={[
                        ".step-tabs-container",
                        ".step-tab",
                        ".step-box",
                        ".step-name",
                        ".step-selection-count",
                        ".step-clear-badge",
                        ".step-images",
                        ".step-image",
                      ]}
                    />
                    <RefGroup
                      title="Category Filter Tabs"
                      items={[".category-tabs", ".category-tab"]}
                    />
                    <RefGroup
                      title="Content Area"
                      items={[
                        ".full-page-content-section",
                        ".full-page-product-grid",
                        ".full-page-product-grid-container",
                        ".inline-qty-btn",
                        ".inline-qty-display",
                      ]}
                    />
                    <RefGroup
                      title="Sidebar Panel"
                      items={[
                        ".sidebar-layout-wrapper",
                        ".full-page-side-panel",
                        ".sidebar-content",
                        ".side-panel-header",
                        ".side-panel-title",
                        ".side-panel-products",
                        ".side-panel-product-row",
                        ".side-panel-product-remove",
                        ".side-panel-progress",
                        ".side-panel-total",
                        ".side-panel-discount-message",
                        ".side-panel-btn-back",
                        ".side-panel-btn-next",
                        ".side-panel-clear-btn",
                      ]}
                    />
                    <RefGroup
                      title="Footer Bar"
                      items={[
                        ".full-page-footer",
                        ".footer-nav-section",
                        ".footer-btn-back",
                        ".footer-btn-next",
                        ".footer-progress-section",
                        ".footer-total-section",
                        ".footer-products-tiles-wrapper",
                        ".footer-product-tile",
                        ".tile-image",
                        ".tile-product-name",
                        ".tile-quantity-badge",
                        ".tile-remove",
                        ".footer-discount-message",
                      ]}
                    />
                    <RefGroup
                      title="Variant Breakdown Popup"
                      items={[
                        ".variant-breakdown-overlay",
                        ".variant-breakdown-popup",
                        ".variant-breakdown-header",
                        ".variant-breakdown-list",
                        ".variant-breakdown-item",
                        ".add-another-variant-btn",
                        ".remove-variant-btn",
                        ".close-breakdown-btn",
                      ]}
                    />
                  </div>

                  <Divider />

                  {/* ── CSS Variables ── */}
                  <BlockStack gap="200">
                    <SectionHead label="CSS Variables" />
                    <Text as="p" variant="bodySm" tone="subdued">
                      Override any variable by targeting{" "}
                      <code
                        style={{
                          fontSize: 11,
                          fontFamily: "monospace",
                          background: "#f0f4ff",
                          padding: "1px 5px",
                          borderRadius: 3,
                        }}
                      >
                        {"#bundle-builder-app { --bundle-*: value; }"}
                      </code>
                    </Text>
                  </BlockStack>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: 16,
                    }}
                  >
                    <RefGroup
                      title="Global Palette"
                      items={[
                        "--bundle-global-primary-button",
                        "--bundle-global-primary-text",
                        "--bundle-global-secondary-text",
                        "--bundle-bg-color",
                        "--bundle-drawer-bg",
                      ]}
                    />
                    <RefGroup
                      title="Product Cards"
                      items={[
                        "--bundle-product-card-bg",
                        "--bundle-product-card-border-radius",
                        "--bundle-product-card-shadow",
                        "--bundle-product-card-hover-shadow",
                        "--bundle-product-card-font-color",
                        "--bundle-product-card-font-size",
                        "--bundle-product-image-border-radius",
                        "--bundle-product-image-height",
                        "--bundle-product-card-spacing",
                        "--bundle-product-cards-per-row",
                      ]}
                    />
                    <RefGroup
                      title="Buttons"
                      items={[
                        "--bundle-button-bg",
                        "--bundle-button-text-color",
                        "--bundle-button-border-radius",
                        "--bundle-button-hover-bg",
                        "--bundle-button-font-size",
                        "--bundle-button-font-weight",
                        "--bundle-add-to-cart-button-bg",
                        "--bundle-add-to-cart-button-text",
                        "--bundle-add-to-cart-button-radius",
                      ]}
                    />
                    <RefGroup
                      title="Product-Page Footer"
                      items={[
                        "--bundle-footer-bg",
                        "--bundle-footer-padding",
                        "--bundle-footer-border-radius",
                        "--bundle-footer-total-bg",
                        "--bundle-footer-final-price-color",
                        "--bundle-footer-final-price-font-size",
                        "--bundle-footer-strike-price-color",
                        "--bundle-footer-next-button-bg",
                        "--bundle-footer-next-button-text",
                        "--bundle-footer-next-button-radius",
                        "--bundle-footer-back-button-bg",
                        "--bundle-footer-back-button-text",
                        "--bundle-footer-back-button-radius",
                      ]}
                    />
                    <RefGroup
                      title="Full-Page Footer"
                      items={[
                        "--bundle-full-page-footer-bg-color",
                        "--bundle-full-page-footer-border-color",
                        "--bundle-full-page-footer-next-btn-bg",
                        "--bundle-full-page-footer-next-btn-color",
                        "--bundle-full-page-footer-back-btn-bg",
                        "--bundle-full-page-footer-back-btn-color",
                        "--bundle-full-page-footer-nav-btn-radius",
                        "--bundle-full-page-footer-total-price-color",
                        "--bundle-full-page-footer-total-label-color",
                        "--bundle-full-page-footer-product-bg",
                        "--bundle-full-page-footer-product-border-radius",
                        "--bundle-full-page-footer-quantity-badge-bg",
                        "--bundle-full-page-footer-quantity-badge-color",
                        "--bundle-full-page-footer-remove-color",
                      ]}
                    />
                    <RefGroup
                      title="Step Timeline"
                      items={[
                        "--bundle-step-timeline-circle-bg",
                        "--bundle-step-timeline-circle-text-color",
                        "--bundle-step-timeline-circle-size",
                        "--bundle-step-timeline-line-color",
                        "--bundle-step-timeline-line-completed",
                        "--bundle-step-timeline-name-color",
                        "--bundle-step-timeline-name-font-size",
                        "--bundle-completed-step-bg-color",
                        "--bundle-completed-step-checkmark-color",
                        "--bundle-incomplete-step-bg-color",
                      ]}
                    />
                    <RefGroup
                      title="Tabs (Step & Category)"
                      items={[
                        "--bundle-tabs-active-bg-color",
                        "--bundle-tabs-active-text-color",
                        "--bundle-tabs-inactive-bg-color",
                        "--bundle-tabs-inactive-text-color",
                        "--bundle-tabs-border-color",
                        "--bundle-tabs-border-radius",
                        "--bundle-header-tab-active-bg",
                        "--bundle-header-tab-active-text",
                        "--bundle-header-tab-inactive-bg",
                        "--bundle-header-tab-inactive-text",
                        "--bundle-category-tab-label-color",
                        "--bundle-category-tab-label-font-size",
                        "--bundle-category-tab-active-underline-color",
                      ]}
                    />
                    <RefGroup
                      title="Promo Banner"
                      items={[
                        "--bundle-promo-banner-bg",
                        "--bundle-promo-banner-padding",
                        "--bundle-promo-banner-radius",
                        "--bundle-promo-banner-title-color",
                        "--bundle-promo-banner-title-font-size",
                        "--bundle-promo-banner-title-font-weight",
                        "--bundle-promo-banner-subtitle-color",
                        "--bundle-promo-banner-subtitle-font-size",
                        "--bundle-promo-banner-note-color",
                        "--bundle-promo-banner-note-font-size",
                      ]}
                    />
                    <RefGroup
                      title="Discount & Messaging"
                      items={[
                        "--bundle-discount-text-color",
                        "--bundle-discount-text-font-size",
                        "--bundle-discount-pill-bg",
                        "--bundle-discount-pill-text",
                        "--bundle-discount-pill-border-radius",
                        "--bundle-discount-pill-font-size",
                        "--bundle-footer-discount-display",
                        "--bundle-success-message-bg-color",
                        "--bundle-success-message-text-color",
                        "--bundle-success-message-font-size",
                        "--bundle-success-message-font-weight",
                      ]}
                    />
                    <RefGroup
                      title="Quantity Selector"
                      items={[
                        "--bundle-quantity-selector-bg",
                        "--bundle-quantity-selector-border-radius",
                        "--bundle-quantity-selector-font-size",
                        "--bundle-quantity-selector-text-color",
                      ]}
                    />
                    <RefGroup
                      title="Modal (Product-Page)"
                      items={[
                        "--bundle-modal-bg-color",
                        "--bundle-modal-border-radius",
                        "--bundle-modal-title-font-size",
                        "--bundle-modal-title-font-weight",
                        "--bundle-modal-price-font-size",
                        "--bundle-modal-button-bg-color",
                        "--bundle-modal-button-text-color",
                        "--bundle-modal-button-border-radius",
                        "--bundle-modal-variant-border-radius",
                      ]}
                    />
                    <RefGroup
                      title="Full-Page General"
                      items={[
                        "--bundle-full-page-bg-color",
                        "--bundle-full-page-title-color",
                        "--bundle-full-page-title-font-size",
                        "--bundle-full-page-instruction-color",
                        "--bundle-full-page-instruction-font-size",
                        "--bundle-full-page-product-image-bg",
                        "--bundle-full-page-product-image-border-radius",
                        "--bundle-full-page-product-image-height",
                        "--bundle-full-page-selected-badge-bg",
                        "--bundle-full-page-selected-badge-color",
                        "--bundle-full-page-product-grid-columns",
                      ]}
                    />
                  </div>

                  <Banner tone="warning">
                    <Text as="p" variant="bodySm">
                      For security, JavaScript URLs, <code>@import</code> rules, and
                      other potentially harmful patterns are automatically removed before saving.
                    </Text>
                  </Banner>
                </BlockStack>
              </Box>
            </Collapsible>

            {/* ── Editor ── */}
            <TextField
              label="Custom CSS Rules"
              labelHidden
              value={customCss}
              onChange={onCustomCssChange}
              multiline={10}
              autoComplete="off"
              monospaced
              placeholder={`/* Example: rounded product cards with hover lift */
.product-card {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-radius: 12px;
  transition: transform 0.2s ease;
}

.product-card:hover {
  transform: translateY(-4px);
}

/* Example: pill-shaped add button */
.product-add-btn {
  border-radius: 24px;
}

/* Example: override a CSS variable */
#bundle-builder-app {
  --bundle-product-card-border-radius: 16px;
  --bundle-footer-next-button-bg: #7c3aed;
}`}
              helpText={`${customCss.length.toLocaleString()} / 50,000 characters used`}
            />

            <InlineStack align="end">
              <Button variant="primary" onClick={onSave} loading={isLoading}>
                Save Custom CSS
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );
}
