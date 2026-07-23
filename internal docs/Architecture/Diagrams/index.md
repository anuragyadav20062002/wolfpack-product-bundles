---
schema_version: 1
id: wpb-architecture-diagram-catalog
title: Critical Operations Architecture Diagram Catalog
type: architecture-diagram-index
status: authoritative
last_audited: 2026-07-14
summary: Index of Mermaid diagrams for Wolfpack checkout, metafield, storefront, backend, and embedded Admin architecture.
owners:
  - Engineering
domains:
  - architecture
  - checkout
  - storefront
  - backend
  - admin-ui
systems:
  - Shopify Admin
  - Shopify Storefront
  - Remix app
  - PostgreSQL
  - Shopify Functions
diagram_format: mermaid
source_paths:
  - ../System Overview.md
  - ../Cart Transform Function.md
  - ../Widget Architecture.md
  - ../Admin Configure Page.md
  - ../../Shopify Integration/Metafields.md
related_diagrams:
  - Cart Transform Runtime Architecture.md
  - Metafield Design and Consumption.md
  - Storefront Frontend Architecture.md
  - Backend Architecture.md
  - Admin UI Frontend Architecture.md
tags:
  - architecture
  - diagram
  - mermaid
  - index
keywords:
  - critical operations
  - system design
  - data flow
  - component map
related_docs:
  - ../System Overview.md
  - ../Cart Transform Function.md
  - ../Widget Architecture.md
  - ../Admin Configure Page.md
  - ../../Shopify Integration/Metafields.md
---

# Critical Operations Architecture Diagram Catalog

Use this page as the canonical entry point for architecture diagrams. Each diagram has stable metadata for document indexing and source-level references for freshness audits.

| Diagram | ID | Primary question | Key systems |
|---|---|---|---|
| [[Cart Transform Runtime Architecture]] | `wpb-cart-transform-runtime` | How does a selected bundle become verified Shopify cart operations? | Storefront widget, app proxy, PostgreSQL, Cart Transform, Discount Function |
| [[Metafield Design and Consumption]] | `wpb-metafield-design-consumption` | Which metafields exist, who owns them, who writes them, and who consumes them? | Remix services, Shopify owners, Liquid, Functions, order metadata |
| [[Storefront Frontend Architecture]] | `wpb-storefront-frontend` | How do Liquid, metafield context, app-proxy hydration, widget modules, and cart operations fit together? | Theme extension, CDN assets, widgets, app proxy, Shopify cart |
| [[Backend Architecture]] | `wpb-backend-architecture` | How are requests authenticated and routed through domain services, persistence, and Shopify APIs? | Remix, auth/session layer, services, Prisma, Shopify APIs |
| [[Admin UI Frontend Architecture]] | `wpb-admin-ui-frontend` | How is the embedded Admin shell composed, and how do route-owned configure flows save data? | Shopify Admin iframe, App Bridge, Redux, Remix routes, Polaris |

## Indexing contract

Architecture diagram documents use these frontmatter fields:

- `id`: stable machine-readable identifier.
- `type`: document class; diagram pages use `architecture-diagram`.
- `status` and `last_audited`: authority and freshness.
- `summary`, `domains`, `systems`, `operations`, `data_entities`: retrieval facets.
- `data_classification`: sensitivity and trust-boundary hints.
- `source_paths`: files that substantiate the diagram.
- `related_docs` and `related_diagrams`: graph edges between knowledge artifacts.
- `graphify`: relevant communities and high-connectivity nodes.
- `tags` and `keywords`: broad and exact-match search terms.
