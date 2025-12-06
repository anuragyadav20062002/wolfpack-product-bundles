# Technical Architecture Guide — Shopify Subscription Billing (Merchant-Facing Apps)

> Ready-to-use technical architecture for integrating Shopify subscription billing into a merchant-facing app. Includes components, data models, code snippets, webhook handling, testing, and operational considerations.

---

## Table of contents
1. Goals & assumptions
2. High-level architecture
3. Components & responsibilities
4. Data model (Prisma example)
5. Billing flow (detailed sequence)
6. Key API calls & examples
7. Webhook handling & reliability
8. Security considerations
9. Testing & staging
10. Observability & operations
11. Deployment patterns
12. Example file layout / routes
13. References

---

## 1. Goals & assumptions
- Enable merchant-facing subscription billing (time-based recurring, usage-based, or combined).  
- Allow merchants to upgrade/downgrade, view billing, and have billing-driven access control.  
- Tech stack assumed: Node.js + TypeScript backend, optional Cloudflare Workers (or serverless) for lightweight endpoints, Prisma ORM for database, Postgres (recommended) for persistence, React/Next.js frontend (App Bridge for embedded apps). Adjust to your stack as needed.

---

## 2. High-level architecture

```
+-------------+          +------------+        +----------------+
| Shopify     | <------> | Your App   | <----> | Database (PG)  |
| (Admin API) |  GraphQL | Backend    |        +----------------+
+-------------+          +------------+        ^  ^        ^
       ^                     ^  ^              |  |        |
       | billing webhooks     |  | appUsage     |  | webhooks|
       | (subscriptions)      |  | records      |  | queue   |
+-------------+          +----------------+    |  |        |
| Merchant UI |  <-----> | Web Frontend   |----+  |        |
+-------------+          +----------------+       |        |
                                                   +--------+
                                                   | Queue  |
                                                   | (e.g.  |
                                                   | Redis) |
                                                   +--------+
```

- Keep billing and webhook verification logic within a backend service that has Admin API access tokens (per-shop).  
- Use a durable queue (Redis/RabbitMQ) for processing webhook events and for creating usage records to ensure idempotency and retries.  
- Store subscription state, IDs, and plan metadata in DB.

---

## 3. Components & responsibilities

### Frontend (Embedded App)
- Show subscription status and plan details.  
- Initiate billing actions (Subscribe / Upgrade / Cancel) by calling your backend which performs `appSubscriptionCreate`.  
- Use Shopify App Bridge for navigation and ensuring merchant context (shop, host, session).  

### Backend — Billing Service
- Creates subscriptions (GraphQL Admin `appSubscriptionCreate`). Save subscription ids & status.  
- Create usage records (`appUsageRecordCreate`) for metered billing.  
- Verify subscription status on app load and gate premium features.  
- Expose routes used by frontend for billing (e.g. `/billing/create`, `/billing/confirm`).  
- Register and verify webhooks for subscription lifecycle and billing attempts.

### Webhook Receiver
- Endpoint(s) for billing-related webhooks: e.g. `app_subscriptions/update`, `subscription_billing_attempts/success`, `subscription_billing_attempts/failure`.  
- Validate HMAC signature. Push events into queue for background processing. Respond 200 quickly to Shopify.

### Worker (optional)
- Use Cloudflare Worker or small serverless function as a public endpoint to accept webhooks and forward to internal services (can help with IP whitelisting, rate limiting).

### Queue & Background Processor
- Process webhooks, update DB, send emails to merchants, revoke access if billing fails.  
- Emit metrics & logs.

### Database
- Store shops, OAuth tokens, subscription records, usage logs, invoices metadata.

---

## 4. Data model (Prisma example)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Shop {
  id            Int       @id @default(autoincrement())
  shopDomain    String    @unique
  accessToken   String
  installedAt   DateTime  @default(now())
  subscriptions Subscription[]
}

model Subscription {
  id                    Int      @id @default(autoincrement())
  shopId                Int
  shop                  Shop     @relation(fields: [shopId], references: [id])
  shopifySubscriptionId String   @unique
  planName              String
  status                String
  currentPeriodEnd      DateTime?
  trialEndsAt           DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  lineItemsJson         String   // raw line items JSON for audit/debug
  usageRecords          UsageRecord[]
}

model UsageRecord {
  id               Int      @id @default(autoincrement())
  subscriptionId   Int
  subscription     Subscription @relation(fields:[subscriptionId], references:[id])
  amount           Float
  description      String?
  recordedAt       DateTime @default(now())
  shopifyRecordId  String?  // the ID returned by appUsageRecordCreate
}
```

---

## 5. Billing flow (detailed sequence)

1. Merchant installs/opens your app. Backend detects shop and OAuth session.  
2. Before enabling premium features, backend calls Admin API to check for an active subscription (query subscriptions by `shopifySubscriptionId` or call `appSubscription` queries).  
3. If not active, frontend shows "Subscribe" CTA which calls backend `/billing/create` route.  
4. Backend constructs and calls `appSubscriptionCreate` mutation — includes `returnUrl`, lineItems (recurring and/or usage) and `test` flag for development. Save the returned payload and `confirmationUrl`. (Merchant must be redirected to this URL).  
5. Merchant approves on Shopify-hosted page. Shopify redirects to your `returnUrl`. Backend verifies the new subscription using the returned subscription ID and updates DB.  
6. For usage-based billing, your app accumulates usage events and periodically creates usage records with `appUsageRecordCreate`. Use batching and idempotency keys to avoid duplicate charges.  
7. Subscribe to webhooks `app_subscriptions/update` and billing attempt events. Use these to reconcile and react to cancellations or payment failure.

---

## 6. Key API calls & examples

### `appSubscriptionCreate` (GraphQL mutation)  
Create subscription and get a confirmation URL to redirect the merchant.

Example (Node + fetch):

```ts
import fetch from "node-fetch";

async function createSubscription(shop: string, accessToken: string, returnUrl: string) {
  const endpoint = `https://${shop}/admin/api/2025-07/graphql.json`;
  const query = `mutation appSubscriptionCreate($name:String!,$returnUrl:URL!,$lineItems:[AppSubscriptionLineItemInput!]!,$test:Boolean!){
    appSubscriptionCreate(name:$name, returnUrl:$returnUrl, lineItems:$lineItems, test:$test){
      confirmationUrl
      appSubscription { id status currentPeriodEnd }
      userErrors { field message }
    }
  }`;
  const variables = {
    name: "Pro Plan - Monthly",
    returnUrl,
    test: true,
    lineItems: [
      {
        plan: {
          appRecurringPricingDetails: {
            interval: "EVERY_30_DAYS",
            price: { amount: 19.99, currencyCode: "USD" }
          }
        }
      }
    ]
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken
    },
    body: JSON.stringify({ query, variables })
  });
  return res.json();
}
```

> Note: Use `test: true` in development to avoid real merchant charges.

### `appUsageRecordCreate` (GraphQL mutation)
Create usage records for metered billing:

```graphql
mutation appUsageRecordCreate($subscriptionLineItemId: ID!, $description: String, $price: Decimal!) {
  appUsageRecordCreate(
    subscriptionLineItemId: $subscriptionLineItemId,
    description: $description,
    price: $price
  ) {
    appUsageRecord { id }
    userErrors { field message }
  }
}
```

---

## 7. Webhook handling & reliability

### Register webhooks
- Register topic `APP_SUBSCRIPTIONS_UPDATE` and billing attempt topics via Partner Dashboard or GraphQL Admin API.  
- Verify webhook HMAC using shared app secret.

### Receiver best practices
- Immediately verify HMAC and return `200` only after valid signature. If invalid, return `401`.  
- Enqueue processing into a durable queue (Redis streams, SQS) — do not perform heavy work synchronously.  
- Implement idempotency: store event `id` and skip duplicates.  
- For critical events (payment failure), trigger alerting and email notifications to the merchant and consider a retry/backoff policy for re-enabling features after payment is fixed.

### Example Express webhook handler (TypeScript)

```ts
import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.raw({ type: "*/*" })); // raw body for HMAC verification

function verifyHmac(secret: string, rawBody: Buffer, hmacHeader: string) {
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  return digest === hmacHeader;
}

app.post("/webhooks/shopify", async (req, res) => {
  const hmac = req.header("x-shopify-hmac-sha256") || "";
  const isValid = verifyHmac(process.env.SHOPIFY_API_SECRET!, req.body, hmac);
  if (!isValid) return res.status(401).send("Invalid signature");

  const topic = req.header("x-shopify-topic");
  const payload = JSON.parse(req.body.toString("utf8"));

  // Enqueue for background processing
  await queue.push({ topic, payload });

  return res.status(200).send("OK");
});
```

---

## 8. Security considerations

- Store OAuth access tokens encrypted at rest (use KMS / secrets manager).  
- Verify webhook HMACs strictly. Reject requests without valid HMAC.  
- Rate limit endpoints (webhooks / billing routes). Shopify may retry webhooks; respond fast.  
- Use least privilege API access for Admin tokens where possible. Rotate tokens and maintain token revocation flows.  
- Validate all incoming merchant `returnUrl` interactions and avoid open redirects.

---

## 9. Testing & staging

- Use `test: true` during development when calling `appSubscriptionCreate`. Shopify provides test charges for dev stores.  
- Use a staging Partner app and a test store (development store) for end-to-end billing tests.  
- Simulate webhook retry and payment failure scenarios. Shopify's docs outline ways to simulate failures.  
- Use ngrok or secure public tunnels for local webhook testing, or deploy a staging webhook endpoint.

---

## 10. Observability & operations

- Emit metrics: subscription_created, subscription_cancelled, billing_attempt_success, billing_attempt_failed, usage_records_created. Use Prometheus/Grafana or cloud provider metrics.  
- Log structured events (request ids, shop domain, subscription id). Store errors centrally (Sentry).  
- Monitor Partner Dashboard payouts and billing earnings for reconciliation.

---

## 11. Deployment patterns

- Single backend process for OAuth and heavy lifting; lighter serverless/webhook receivers for public endpoints if desired.  
- Use feature flags to gate billing-related features during rollout.  
- Use database migrations for subscription schema changes (Prisma migrate).

---

## 12. Example file layout / routes

```
/src
  /controllers
    billing.controller.ts
    webhook.controller.ts
  /services
    shop.service.ts
    billing.service.ts
    usage.service.ts
  /queues
    webhook.processor.ts
  /db
    prisma.ts
  /routes
    index.ts
    billing.ts -> /billing/create /billing/confirm /billing/status
    webhooks.ts -> /webhooks/shopify
```

### Example billing routes
- `POST /billing/create` — create subscription and return `confirmationUrl`.  
- `GET /billing/confirm` — handle Shopify return and update subscription (accepts `shop` and subscription id params).  
- `GET /billing/status` — quick check endpoint for UI to fetch current plan and status.

---

## 13. References (official Shopify docs)
- Billing overview — https://shopify.dev/docs/apps/launch/billing/subscription-billing  
- appSubscriptionCreate (GraphQL Admin) — https://shopify.dev/docs/api/admin-graphql/latest/mutations/appsubscriptioncreate  
- Create usage-based subscriptions — https://shopify.dev/docs/apps/launch/billing/subscription-billing/create-usage-based-subscriptions  
- appUsageRecordCreate — https://shopify.dev/docs/api/admin-graphql/latest/mutations/appusagerecordcreate  
- Webhooks configuration — https://shopify.dev/docs/apps/webhooks/configuration  
- Offer free trials — https://shopify.dev/docs/apps/launch/billing/offer-free-trials

---

## Appendix: Quick checklist for implementation
- [ ] Register app in Partner Dashboard and set App URL and Redirect URLs.  
- [ ] Implement OAuth and store tokens securely.  
- [ ] Implement billing routes and `appSubscriptionCreate`. Test with `test:true`.  
- [ ] Implement usage recording with batching and idempotency.  
- [ ] Register and verify webhooks; implement queue-based processing.  
- [ ] Add UI for plan management and billing status.  
- [ ] Add monitoring, logging, and alerts for billing failures.

---

*Generated for you — let me know if you want this exported as PDF or DOCX, or if you'd like code templates (Express/Cloudflare Worker) wired to this architecture.*
