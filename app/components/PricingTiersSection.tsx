/**
 * PricingTiersSection
 *
 * Admin UI for configuring up to 4 pricing tier pills on a full-page bundle.
 * Each tier has a text label and a linked bundle (selected from existing bundles
 * in the shop). Shown in the Full-Page Bundle configure route.
 */

import {
  BlockStack,
  Card,
  Text,
  Button,
  Divider,
  InlineStack,
  TextField,
  Select,
  Badge,
  EmptyState,
} from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import type { TierConfigEntry } from "../types/tier-config";

interface PricingTiersSectionProps {
  tiers: TierConfigEntry[];
  availableBundles: { id: string; name: string }[];
  currentBundleId: string;
  onChange: (tiers: TierConfigEntry[]) => void;
}

const MAX_TIERS = 4;

export function PricingTiersSection({
  tiers,
  availableBundles,
  currentBundleId,
  onChange,
}: PricingTiersSectionProps) {
  const bundleOptions = [
    { label: "— Select a bundle —", value: "" },
    ...availableBundles.map((b) => ({
      label: b.id === currentBundleId ? `${b.name} (this bundle)` : b.name,
      value: b.id,
    })),
  ];

  function addTier() {
    if (tiers.length >= MAX_TIERS) return;
    onChange([...tiers, { label: "", linkedBundleId: "" }]);
  }

  function removeTier(index: number) {
    onChange(tiers.filter((_, i) => i !== index));
  }

  function updateTier(index: number, field: keyof TierConfigEntry, value: string) {
    const updated = tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t));
    onChange(updated);
  }

  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="100">
              <InlineStack gap="200" blockAlign="center">
                <Text variant="headingSm" fontWeight="semibold" as="p">
                  Pricing Tiers
                </Text>
                <Badge tone="info">Full-page only</Badge>
              </InlineStack>
              <Text variant="bodyXs" tone="subdued" as="p">
                Show 2–4 pricing tier pills at the top of the bundle page. Each tier links to a separate Bundle record.
                Requires at least 2 tiers to appear on the storefront.
              </Text>
            </BlockStack>
          </InlineStack>

          <Divider />

          {tiers.length === 0 ? (
            <EmptyState
              heading="No pricing tiers configured"
              image=""
              action={{ content: "Add first tier", onAction: addTier }}
            >
              <Text as="p" variant="bodySm" tone="subdued">
                Add at least 2 tiers to enable the tier pill selector on this bundle page.
              </Text>
            </EmptyState>
          ) : (
            <BlockStack gap="300">
              {tiers.map((tier, index) => (
                <Card key={index} padding="300">
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="headingXs" fontWeight="semibold" as="p">
                        Tier {index + 1}
                      </Text>
                      <Button
                        variant="plain"
                        tone="critical"
                        icon={DeleteIcon}
                        onClick={() => removeTier(index)}
                        accessibilityLabel={`Remove tier ${index + 1}`}
                      />
                    </InlineStack>

                    <TextField
                      label="Label"
                      value={tier.label}
                      onChange={(value) => updateTier(index, "label", value)}
                      placeholder="e.g. Buy 3 @ ₹699"
                      helpText="Shown on the pill button (max 50 characters)"
                      maxLength={50}
                      autoComplete="off"
                    />

                    <Select
                      label="Linked bundle"
                      options={bundleOptions}
                      value={tier.linkedBundleId}
                      onChange={(value) => updateTier(index, "linkedBundleId", value)}
                      helpText="Products and pricing from this bundle are loaded when the shopper selects this tier"
                    />
                  </BlockStack>
                </Card>
              ))}
            </BlockStack>
          )}

          {tiers.length < MAX_TIERS && (
            <Button
              variant="secondary"
              icon={PlusIcon}
              onClick={addTier}
            >
              Add tier
            </Button>
          )}

          {tiers.length >= 2 && (
            <Text as="p" variant="bodySm" tone="subdued">
              {tiers.length} tier{tiers.length > 1 ? "s" : ""} configured — pill bar will be visible on the storefront.
            </Text>
          )}
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
