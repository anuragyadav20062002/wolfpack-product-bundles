import { PRICING_FAQ, type FAQItem } from "../../constants/pricing-data";

export interface FAQSectionProps {
  faqs?: FAQItem[];
}

export function FAQSection({ faqs = PRICING_FAQ }: FAQSectionProps) {
  return (
    <s-section>
      <s-stack direction="block" gap="base">
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Frequently Asked Questions</h3>
        <s-stack direction="block" gap="base">
          {faqs.map((faq, index) => (
            <s-stack key={index} direction="block" gap="small-400">
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{faq.question}</p>
              <p style={{ margin: 0, fontSize: 14, color: "#6d7175" }}>{faq.answer}</p>
            </s-stack>
          ))}
        </s-stack>
      </s-stack>
    </s-section>
  );
}
