import { Card, Text, BlockStack, Button, InlineStack } from "@shopify/polaris";

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
        <Text variant="bodySm" tone="subdued">
          {subtitle}
        </Text>
        
        <BlockStack gap="200">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isAvailable = bundlesExist || stepNumber <= 3; // First 3 steps always available
            const stepColor = isAvailable ? '#008060' : '#999';
            
            if (step.isClickable && step.onClick && isAvailable) {
              return (
                <Button 
                  key={step.id}
                  variant="plain" 
                  fullWidth 
                  textAlign="left"
                  onClick={step.onClick}
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
                      <Text variant="bodySm" fontWeight="medium">
                        {step.title}
                      </Text>
                      <Text variant="bodyXs" tone="subdued">
                        {step.description}
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Button>
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
                    >
                      {step.title}
                    </Text>
                    <Text variant="bodyXs" tone="subdued">
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