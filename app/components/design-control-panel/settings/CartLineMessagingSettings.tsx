import { BlockStack, Button, Divider, InlineStack, Select, Text } from "@shopify/polaris";
import type { BundleCartLineMessagingSettings } from "../../../types/state.types";
import designControlPanelStyles from "../../../styles/routes/design-control-panel.module.css";
import type { SettingsComponentProps } from "./types";

const DEFAULT_CART_LINE_MESSAGING: BundleCartLineMessagingSettings = {
  isEnabled: true,
  showBundleContains: true,
  showOriginalPrice: true,
  discountDisplay: {
    isEnabled: true,
    format: "amount_percentage",
  },
};

const DISCOUNT_FORMAT_OPTIONS = [
  { label: 'Amount and percentage (Eg: "You save $73.00 (19%)")', value: "amount_percentage" },
  { label: 'Amount only (Eg: "You save $73.00")', value: "amount" },
  { label: 'Percentage only (Eg: "You save 19%")', value: "percentage" },
];

function getMessagingSettings(settings: SettingsComponentProps["settings"]): BundleCartLineMessagingSettings {
  const saved = settings.bundleCartLineMessaging;

  return {
    ...DEFAULT_CART_LINE_MESSAGING,
    ...saved,
    discountDisplay: {
      ...DEFAULT_CART_LINE_MESSAGING.discountDisplay,
      ...saved?.discountDisplay,
    },
  };
}

function ToggleSwitch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      className={designControlPanelStyles.cartMessagingSwitch}
      onClick={() => onChange(!checked)}
    >
      <span className={designControlPanelStyles.cartMessagingSwitchTrack} aria-hidden="true" />
    </button>
  );
}

function InfoDot() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: "1px solid #303030",
        color: "#303030",
        fontSize: 10,
        lineHeight: "14px",
        fontWeight: 700,
      }}
    >
      ?
    </span>
  );
}

function MessagingRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div>
      <InlineStack align="space-between" blockAlign="center" gap="300">
        <InlineStack blockAlign="center" gap="150">
          <Text as="p" variant="bodyMd" fontWeight="semibold">
            {label}
          </Text>
          <InfoDot />
        </InlineStack>
        <ToggleSwitch checked={checked} label={label} onChange={onChange} />
      </InlineStack>
      <div style={{ marginTop: 6 }}>
        <Text as="p" variant="bodySm" tone="subdued">
          {description}
        </Text>
      </div>
    </div>
  );
}

export function CartLineMessagingSettings({ settings, onUpdate }: SettingsComponentProps) {
  const messaging = getMessagingSettings(settings);

  function updateMessaging(next: BundleCartLineMessagingSettings) {
    onUpdate("bundleCartLineMessaging", next);
  }

  function updateDiscountDisplay(next: Partial<BundleCartLineMessagingSettings["discountDisplay"]>) {
    updateMessaging({
      ...messaging,
      discountDisplay: {
        ...messaging.discountDisplay,
        ...next,
      },
    });
  }

  return (
    <div
      style={{
        border: "1px solid #DADADA",
        borderRadius: 8,
        background: "#FFFFFF",
        padding: 16,
      }}
    >
    <BlockStack gap="400">
      <InlineStack align="space-between" blockAlign="center" gap="300">
        <InlineStack blockAlign="center" gap="150">
          <Text as="h2" variant="headingMd">
            Cart Messaging
          </Text>
          <InfoDot />
          <ToggleSwitch
            checked={messaging.isEnabled}
            label="Cart Messaging"
            onChange={(checked) => updateMessaging({ ...messaging, isEnabled: checked })}
          />
        </InlineStack>
        <Button disabled>Edit Language</Button>
      </InlineStack>

      <div
        style={{
          border: "1px solid #DADADA",
          borderRadius: 8,
          padding: 16,
          background: "#FFFFFF",
        }}
      >
        <BlockStack gap="300">
          <MessagingRow
            label="Bundle Items"
            description="Shows the individual items within a bundle"
            checked={messaging.showBundleContains}
            onChange={(checked) => updateMessaging({ ...messaging, showBundleContains: checked })}
          />
          <Divider />
          <MessagingRow
            label="Original Bundle Price"
            description="Shows the retail price before bundle discount"
            checked={messaging.showOriginalPrice}
            onChange={(checked) => updateMessaging({ ...messaging, showOriginalPrice: checked })}
          />
          <Divider />
          <MessagingRow
            label="Discount Display"
            description="Shows how much the customer is saving on the bundle"
            checked={messaging.discountDisplay.isEnabled}
            onChange={(checked) => updateDiscountDisplay({ isEnabled: checked })}
          />
          {messaging.discountDisplay.isEnabled && (
            <Select
              label="Discount format"
              options={DISCOUNT_FORMAT_OPTIONS}
              value={messaging.discountDisplay.format}
              onChange={(format) => updateDiscountDisplay({ format })}
            />
          )}
        </BlockStack>
      </div>
    </BlockStack>
    </div>
  );
}
