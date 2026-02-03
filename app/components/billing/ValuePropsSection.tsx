/**
 * Value Props Section Component
 *
 * Displays the "Why Upgrade" value propositions for Free plan users.
 */

import {
  Card,
  Text,
  BlockStack,
  InlineStack,
  Icon,
  useBreakpoints,
} from "@shopify/polaris";
import { StarFilledIcon } from "@shopify/polaris-icons";
import { VALUE_PROPS, type ValueProp } from "../../constants/pricing-data";

export interface ValuePropsSectionProps {
  valueProps?: ValueProp[];
}

export function ValuePropsSection({
  valueProps = VALUE_PROPS,
}: ValuePropsSectionProps) {
  const { mdDown } = useBreakpoints();

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack gap="200" blockAlign="center">
          <div style={{ color: '#ffc453' }}>
            <Icon source={StarFilledIcon} />
          </div>
          <Text as="h3" variant="headingMd">
            Why Upgrade to Grow?
          </Text>
        </InlineStack>
        <div style={{
          display: 'grid',
          gridTemplateColumns: mdDown ? '1fr' : 'repeat(3, 1fr)',
          gap: '1rem'
        }}>
          {valueProps.map((prop, index) => (
            <div
              key={index}
              style={{
                padding: '1rem',
                backgroundColor: '#f6f6f7',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <BlockStack gap="200" align="center">
                <Text as="span" variant="heading2xl">{prop.icon}</Text>
                <Text as="h4" variant="headingSm">{prop.title}</Text>
                <Text as="p" variant="bodySm" tone="subdued">{prop.description}</Text>
              </BlockStack>
            </div>
          ))}
        </div>
      </BlockStack>
    </Card>
  );
}
