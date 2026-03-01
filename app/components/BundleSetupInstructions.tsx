import { Card, Text, BlockStack, InlineStack } from "@shopify/polaris";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  isClickable?: boolean;
  onClick?: () => void;
}

interface BundleSetupInstructionsProps {
  title: string;
  subtitle: string;
  steps: SetupStep[];
  bundlesExist: boolean;
}

export function BundleSetupInstructions({
  title,
  subtitle,
  steps,
  bundlesExist,
}: BundleSetupInstructionsProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingSm" as="h3">
          {title}
        </Text>
        <Text variant="bodySm" tone="subdued" as="p">
          {subtitle}
        </Text>

        <BlockStack gap="200">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isAvailable = bundlesExist || stepNumber <= 3; // First 3 steps always available
            const stepColor = isAvailable ? '#008060' : '#999';
            const isClickable = step.isClickable && step.onClick && isAvailable;

            return (
              <div
                key={step.id}
                onClick={isClickable ? step.onClick : undefined}
                style={{
                  cursor: isClickable ? 'pointer' : 'default',
                  opacity: isAvailable ? 1 : 0.6,
                  padding: '8px',
                  margin: '-8px',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (isClickable) {
                    e.currentTarget.style.backgroundColor = '#f6f6f7';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isClickable) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <InlineStack gap="300" align="start" blockAlign="start">
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: stepColor,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {stepNumber}
                  </div>
                  <BlockStack gap="100">
                    <Text
                      variant="bodySm"
                      fontWeight="semibold"
                      as="p"
                    >
                      {step.title}
                    </Text>
                    <Text variant="bodySm" tone="subdued" as="p">
                      {step.description}
                    </Text>
                  </BlockStack>
                </InlineStack>
              </div>
            );
          })}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}