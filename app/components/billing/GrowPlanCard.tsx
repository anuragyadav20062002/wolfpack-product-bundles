/**
 * Grow Plan Card Component
 *
 * Displays the Grow plan details with "Most Popular" badge.
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

export interface GrowPlanCardProps {
  isCurrentPlan: boolean;
  isUpgrading: boolean;
  onSelectPlan: () => void;
}

export function GrowPlanCard({
  isCurrentPlan,
  isUpgrading,
  onSelectPlan,
}: GrowPlanCardProps) {
  return (
    <div style={{ position: 'relative' }}>
      {/* Most Popular Badge */}
      <div style={{
        position: 'absolute',
        top: '-12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        backgroundColor: '#ffc96b',
        color: '#3d3d3d',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <span style={{ fontSize: '14px' }}>⭐</span>
        <span>Most Popular</span>
      </div>

      <Card>
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: isCurrentPlan ? 'none' : '2px solid #005bd3',
          borderRadius: '12px',
          margin: '-16px',
          padding: '16px',
        }}>
          <BlockStack gap="500">
            <BlockStack gap="200">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingLg">
                  {PLANS.grow.name}
                </Text>
                {isCurrentPlan && <Badge tone="success">Current Plan</Badge>}
              </InlineStack>
              <InlineStack gap="100" blockAlign="baseline">
                <Text as="p" variant="heading2xl" fontWeight="bold">
                  ${PLANS.grow.price}
                </Text>
                <Text as="span" variant="bodyLg" tone="subdued">
                  / month
                </Text>
              </InlineStack>
              <Text as="p" variant="bodyMd" tone="subdued">
                For growing businesses ready to scale
              </Text>
            </BlockStack>

            <Divider />

            <BlockStack gap="300">
              <Text as="p" variant="bodyMd" fontWeight="semibold">
                Everything in Free, plus:
              </Text>
              <BlockStack gap="200">
                {PLANS.grow.features.map((feature, index) => (
                  <InlineStack key={index} gap="200" blockAlign="center">
                    <div style={{ color: '#008060' }}>
                      <Icon source={CheckIcon} tone="success" />
                    </div>
                    <Text as="span" variant="bodyMd" fontWeight={index < 4 ? "semibold" : "regular"}>
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
              variant="primary"
              disabled={isCurrentPlan}
              loading={isUpgrading}
              onClick={onSelectPlan}
            >
              {isCurrentPlan ? "Current Plan" : "Upgrade to Grow"}
            </Button>
            {!isCurrentPlan && (
              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <Text as="p" variant="bodySm" tone="subdued">
                  Cancel anytime. Billed through Shopify.
                </Text>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
