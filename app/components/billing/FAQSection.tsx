/**
 * FAQ Section Component
 *
 * Displays frequently asked questions about pricing and billing.
 */

import {
  Card,
  Text,
  BlockStack,
} from "@shopify/polaris";
import { PRICING_FAQ, type FAQItem } from "../../constants/pricing-data";

export interface FAQSectionProps {
  faqs?: FAQItem[];
}

export function FAQSection({ faqs = PRICING_FAQ }: FAQSectionProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          Frequently Asked Questions
        </Text>
        <BlockStack gap="400">
          {faqs.map((faq, index) => (
            <BlockStack key={index} gap="100">
              <Text as="p" variant="bodyMd" fontWeight="semibold">
                {faq.question}
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                {faq.answer}
              </Text>
            </BlockStack>
          ))}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
