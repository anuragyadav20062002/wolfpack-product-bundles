/**
 * Feature Comparison Table Component
 *
 * Displays the feature comparison table between Free and Grow plans.
 */

import {
  Card,
  Text,
  BlockStack,
  Icon,
} from "@shopify/polaris";
import { CheckIcon, XIcon } from "@shopify/polaris-icons";
import { FEATURE_COMPARISON, type FeatureComparisonRow } from "../../constants/pricing-data";

/**
 * Render feature value (checkmark, x, or text)
 */
function renderFeatureValue(value: boolean | string) {
  if (value === true) {
    return (
      <div style={{ color: '#008060' }}>
        <Icon source={CheckIcon} tone="success" />
      </div>
    );
  }
  if (value === false) {
    return (
      <div style={{ color: '#8c9196' }}>
        <Icon source={XIcon} tone="subdued" />
      </div>
    );
  }
  return (
    <Text as="span" variant="bodyMd" fontWeight="medium">
      {value}
    </Text>
  );
}

export interface FeatureComparisonTableProps {
  features?: FeatureComparisonRow[];
}

export function FeatureComparisonTable({
  features = FEATURE_COMPARISON,
}: FeatureComparisonTableProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          Feature Comparison
        </Text>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e1e3e5' }}>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 8px',
                  fontWeight: 600,
                  color: '#202223'
                }}>
                  Feature
                </th>
                <th style={{
                  textAlign: 'center',
                  padding: '12px 8px',
                  fontWeight: 600,
                  color: '#202223',
                  width: '120px'
                }}>
                  Free
                </th>
                <th style={{
                  textAlign: 'center',
                  padding: '12px 8px',
                  fontWeight: 600,
                  color: '#005bd3',
                  width: '120px',
                  backgroundColor: '#f0f5ff',
                  borderRadius: '8px 8px 0 0'
                }}>
                  Grow
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((row, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: '1px solid #e1e3e5',
                    backgroundColor: row.highlight ? '#fafbfb' : 'transparent'
                  }}
                >
                  <td style={{
                    padding: '12px 8px',
                    color: '#202223',
                    fontWeight: row.highlight ? 500 : 400
                  }}>
                    {row.feature}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: '12px 8px'
                  }}>
                    {renderFeatureValue(row.free)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: '12px 8px',
                    backgroundColor: '#f0f5ff'
                  }}>
                    {renderFeatureValue(row.grow)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BlockStack>
    </Card>
  );
}
