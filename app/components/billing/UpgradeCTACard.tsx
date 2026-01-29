/**
 * Upgrade CTA Card Component
 *
 * Call-to-action card for Free plan users to upgrade to Grow.
 */

import {
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Icon,
} from "@shopify/polaris";
import { StarFilledIcon } from "@shopify/polaris-icons";
import { PLANS } from "../../constants/plans";

export interface UpgradeCTACardProps {
  onUpgrade: () => void;
}

export function UpgradeCTACard({ onUpgrade }: UpgradeCTACardProps) {
  return (
    <Card>
      <div style={{
        background: 'linear-gradient(135deg, #f6f6f7 0%, #ebeced 100%)',
        borderRadius: '8px',
        padding: '20px',
        margin: '-16px',
      }}>
        <BlockStack gap="400">
          <InlineStack gap="200" blockAlign="center">
            <div style={{
              backgroundColor: '#ffc96b',
              borderRadius: '50%',
              padding: '8px',
              display: 'flex',
            }}>
              <Icon source={StarFilledIcon} />
            </div>
            <Text as="h3" variant="headingMd">
              Ready to grow your bundle business?
            </Text>
          </InlineStack>

          <Text as="p" variant="bodyMd">
            Upgrade to the Grow plan for double the bundles, full design customization, and priority support.
          </Text>

          <InlineStack gap="200">
            <div style={{
              backgroundColor: 'white',
              borderRadius: '6px',
              padding: '8px 12px',
            }}>
              <Text as="span" variant="bodySm" fontWeight="semibold">
                20 bundles
              </Text>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '6px',
              padding: '8px 12px',
            }}>
              <Text as="span" variant="bodySm" fontWeight="semibold">
                Design Control Panel
              </Text>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '6px',
              padding: '8px 12px',
            }}>
              <Text as="span" variant="bodySm" fontWeight="semibold">
                Priority Support
              </Text>
            </div>
          </InlineStack>

          <InlineStack align="space-between" blockAlign="center">
            <Button
              variant="primary"
              onClick={onUpgrade}
            >
              {`Upgrade to Grow - $${PLANS.grow.price}/month`}
            </Button>
            <Text as="span" variant="bodySm" tone="subdued">
              Cancel anytime
            </Text>
          </InlineStack>
        </BlockStack>
      </div>
    </Card>
  );
}
