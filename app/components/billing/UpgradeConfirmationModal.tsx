/**
 * Upgrade Confirmation Modal Component
 *
 * Modal that confirms upgrade to Grow plan before redirecting to Shopify billing.
 */

import {
  Modal,
  Text,
  BlockStack,
  InlineStack,
  Banner,
  Divider,
  Icon,
} from "@shopify/polaris";
import { CheckIcon } from "@shopify/polaris-icons";
import { PLANS } from "../../constants/plans";
import { GROW_PLAN_BENEFITS } from "../../constants/pricing-data";

export interface UpgradeConfirmationModalProps {
  open: boolean;
  isLoading: boolean;
  currentBundleCount: number;
  bundleLimit: number;
  onConfirm: () => void;
  onClose: () => void;
}

export function UpgradeConfirmationModal({
  open,
  isLoading,
  currentBundleCount,
  bundleLimit,
  onConfirm,
  onClose,
}: UpgradeConfirmationModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upgrade to Grow Plan"
      primaryAction={{
        content: `Confirm Upgrade - $${PLANS.grow.price}/month`,
        onAction: onConfirm,
        loading: isLoading,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Banner tone="info">
            <Text as="p" variant="bodyMd">
              You'll be redirected to Shopify to complete your subscription.
            </Text>
          </Banner>

          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">
              What you'll get with Grow:
            </Text>
            <BlockStack gap="200">
              <InlineStack gap="200" blockAlign="center">
                <div style={{ color: '#008060' }}>
                  <Icon source={CheckIcon} tone="success" />
                </div>
                <Text as="span" variant="bodyMd">
                  Up to 20 bundles (currently {currentBundleCount}/{bundleLimit})
                </Text>
              </InlineStack>
              {GROW_PLAN_BENEFITS.slice(1).map((benefit, index) => (
                <InlineStack key={index} gap="200" blockAlign="center">
                  <div style={{ color: '#008060' }}>
                    <Icon source={CheckIcon} tone="success" />
                  </div>
                  <Text as="span" variant="bodyMd">{benefit}</Text>
                </InlineStack>
              ))}
            </BlockStack>
          </BlockStack>

          <Divider />

          <InlineStack align="space-between">
            <Text as="span" variant="bodyMd" tone="subdued">
              Billed monthly through Shopify
            </Text>
            <Text as="span" variant="headingMd" fontWeight="bold">
              ${PLANS.grow.price}/month
            </Text>
          </InlineStack>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
