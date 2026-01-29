/**
 * Free Plan Card Component
 *
 * Displays the Free plan details in the pricing comparison.
 */

import {
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Badge,
  Divider,
  Icon,
} from "@shopify/polaris";
import { CheckIcon } from "@shopify/polaris-icons";
import { PLANS } from "../../constants/plans";

export interface FreePlanCardProps {
  isCurrentPlan: boolean;
}

export function FreePlanCard({ isCurrentPlan }: FreePlanCardProps) {
  return (
    <Card>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <BlockStack gap="500">
          <BlockStack gap="200">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h3" variant="headingLg">
                {PLANS.free.name}
              </Text>
              {isCurrentPlan && <Badge tone="success">Current Plan</Badge>}
            </InlineStack>
            <InlineStack gap="100" blockAlign="baseline">
              <Text as="p" variant="heading2xl" fontWeight="bold">
                Free
              </Text>
            </InlineStack>
            <Text as="p" variant="bodyMd" tone="subdued">
              Perfect for getting started with bundles
            </Text>
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            <Text as="p" variant="bodyMd" fontWeight="semibold">
              Includes:
            </Text>
            <BlockStack gap="200">
              {PLANS.free.features.map((feature, index) => (
                <InlineStack key={index} gap="200" blockAlign="center">
                  <div style={{ color: '#008060' }}>
                    <Icon source={CheckIcon} tone="success" />
                  </div>
                  <Text as="span" variant="bodyMd">
                    {feature}
                  </Text>
                </InlineStack>
              ))}
            </BlockStack>
          </BlockStack>
        </BlockStack>

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
          <Button
            fullWidth
            variant={isCurrentPlan ? "secondary" : "primary"}
            disabled={true}
          >
            {isCurrentPlan ? "Current Plan" : "Free Plan"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
