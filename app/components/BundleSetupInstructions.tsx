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
      <BlockStack gap="300">
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
            
            if (step.isClickable && step.onClick && isAvailable) {
              return (
                <div 
                  key={step.id}
                  onClick={step.onClick}
                  style={{ cursor: 'pointer', padding: '12px 0', borderRadius: '8px' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f3f3'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <InlineStack gap="200" align="start">
                    <div style={{ 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      backgroundColor: stepColor, 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      flexShrink: 0, 
                      marginTop: '2px' 
                    }}>
                      {stepNumber}
                    </div>
                    <BlockStack gap="050">
                      <Text variant="bodySm" fontWeight="medium" as="p">
                        {step.title}
                      </Text>
                      <Text variant="bodyXs" tone="subdued" as="p">
                        {step.description}
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </div>
              );
            }
            
            return (
              <div key={step.id} style={{ 
                cursor: 'default', 
                opacity: isAvailable ? 1 : 0.6 
              }}>
                <InlineStack gap="200" align="start">
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    backgroundColor: stepColor, 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    flexShrink: 0, 
                    marginTop: '2px' 
                  }}>
                    {stepNumber}
                  </div>
                  <BlockStack gap="050">
                    <Text 
                      variant="bodySm" 
                      fontWeight="medium" 
                      tone={isAvailable ? undefined : "subdued"}
                      as="p"
                    >
                      {step.title}
                    </Text>
                    <Text variant="bodyXs" tone="subdued" as="p">
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