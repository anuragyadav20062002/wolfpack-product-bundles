---
source_file: "docs/inngest-webhook-queue/03-architecture.md"
type: "document"
community: "Community 11"
tags:
  - graphify/document
  - graphify/EXTRACTED
  - community/Community_11
---

# Inngest Webhook Queue — Architecture ADR

## Connections
- [[Inngest Remix Serve Route (api.inngest.tsx)]] - `implements` [EXTRACTED]
- [[Inngest Webhook Queue — PO Requirements]] - `references` [EXTRACTED]
- [[Inngest Webhook Queue — SDE Implementation Plan]] - `references` [EXTRACTED]
- [[Inngest — Managed Durable Event Queue]] - `uses` [EXTRACTED]
- [[WebhookEvent DB Table — Idempotency Logic]] - `depends_on` [EXTRACTED]
- [[WebhookProcessor.processPubSubMessage()]] - `uses` [EXTRACTED]

#graphify/document #graphify/EXTRACTED #community/Community_11