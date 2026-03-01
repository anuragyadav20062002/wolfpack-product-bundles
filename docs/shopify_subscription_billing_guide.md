# Subscription Billing Setup for Shopify Merchant-Facing Apps
*A complete framework + step-by-step guide with official Shopify documentation links*

## 📌 1. Overview: What Shopify Recommends
Shopify’s recommended approach for charging merchants is through the **Shopify Billing API** using:

- **App Subscriptions** → recurring monthly/annual billing  
- **Usage-Based Billing** → metered billing inside a subscription  
- **One-Time Charges** → optional, but rarely used for SaaS apps

Merchants must **approve charges in the Shopify-hosted confirmation page**.

**Official Docs:**  
- Billing Overview → https://shopify.dev/docs/apps/billing  
- App Subscriptions → https://shopify.dev/docs/api/admin-graphql/latest/mutations/appSubscriptionCreate  
- Usage Charges → https://shopify.dev/docs/apps/billing/usage-based-billing  

## 📌 2. Billing Models You Can Implement
### 2.1 Recurring Billing  
Docs: https://shopify.dev/docs/apps/billing/subscriptions/recurring

### 2.2 Usage-Based Billing  
Docs: https://shopify.dev/docs/apps/billing/usage-based-billing

### 2.3 Combined Billing  
Docs: https://shopify.dev/docs/apps/billing/subscriptions

## 📌 3. End-to-End Billing Flow
1. Detect active subscription  
2. Create subscription using `appSubscriptionCreate`  
3. Redirect merchant to confirmation page  
4. Handle `returnUrl`  
5. Store subscription data  
6. Listen to billing webhooks  
7. Enforce paid gating  
8. Allow upgrade/downgrade  

## 📌 4. Example `appSubscriptionCreate` Mutation
```graphql
mutation createAppSubscription(
  $name: String!,
  $returnUrl: URL!,
  $test: Boolean!,
  $lineItems: [AppSubscriptionLineItemInput!]!
) {
  appSubscriptionCreate(
    name: $name,
    returnUrl: $returnUrl,
    test: $test,
    lineItems: $lineItems
  ) {
    confirmationUrl
    userErrors { field message }
  }
}
```

## 📌 5. Example Recurring Plan
```json
{
  "lineItems": [
    {
      "plan": {
        "appRecurringPricingDetails": {
          "interval": "EVERY_30_DAYS",
          "price": { "amount": 19.99, "currencyCode": "USD" }
        }
      }
    }
  ]
}
```

## 📌 6. Usage Billing Example  
Docs: https://shopify.dev/docs/api/admin-graphql/latest/mutations/appUsageRecordCreate

## 📌 7. Required Webhooks  
Important topics:
- app_subscriptions/update  
- subscription_billing_attempts/success  
- subscription_billing_attempts/failure  

Docs: https://shopify.dev/docs/apps/webhooks/configuration

## 📌 8. Testing Subscription Billing  
Docs: https://shopify.dev/docs/apps/billing/testing

## 📌 9. Compliance for Shopify App Store  
Docs:
- Pricing → https://shopify.dev/docs/apps/billing/pricing  
- Billing Policies → https://shopify.dev/docs/apps/billing/policies  

## 📌 10. Full Checklist
- Implement appSubscriptionCreate  
- Redirect merchant to confirmation page  
- Save subscription data  
- Track subscription via webhooks  
- Block premium features if inactive  
- Test with test=true  
