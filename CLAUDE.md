# CLAUDE.md

## 🚨 MCP Server Usage

**MANDATORY**: Always use Shopify dev MCP server for Shopify development. Query MCP before implementing changes, validate GraphQL/components, never assume APIs.

**Key MCP Tools:**
- `mcp__shopify-dev-mcp__learn_shopify_api` - Initialize API context
- `mcp__shopify-dev-mcp__search_docs_chunks` - Search documentation
- `mcp__shopify-dev-mcp__validate_graphql_codeblocks` - Validate GraphQL
- `mcp__shopify-dev-mcp__introspect_graphql_schema` - Explore schema

---

## Development Commands

**Main:** `npm run dev` (start), `npm run build`, `npm run lint`
**Functions:** `cd extensions/[function-name]` → `npm run build/test/typegen`
**Database:** `npx prisma generate/migrate dev/db push`

## Architecture

**Stack:** Remix + Shopify App Bridge + Prisma + PostgreSQL + Polaris  
**Dual Bundle System:** Discount Functions (all plans) + Cart Transform (Plus only)

**Core Models:** Bundle → BundleStep → StepProduct, BundlePricing, BundleAnalytics  
**Metafields:** `bundle_discounts` namespace for function configuration  
**Functions:** WebAssembly, ORDER/PRODUCT/SHIPPING discount classes

## Key Files

**Routes:** `app/routes/app.bundles.[type].configure.$bundleId.tsx` (configuration)  
**Extensions:** `extensions/bundle-[type]-ts/` (functions)  
**Database:** `prisma/schema.prisma`  
**Config:** `shopify.app.toml`, `shopify.extension.toml`

## Bundle Flow

**Publishing:** Admin → Database → Shopify discount → Metafields → Function activation  
**Runtime:** Cart analysis → Bundle matching → Discount/transform operations  
**Testing:** Vitest (functions), ESLint (app)

## Database Schema

**Multi-tenant:** All entities have `shopId`  
**JSONB fields:** Bundle.settings, BundleStep.products/collections, BundlePricing.rules  
**Enums:** BundleStatus, JobStatus, DiscountMethodType  
**Indexing:** Shop-based queries, status filtering, time-series data

## Key APIs

**GraphQL:** `discountAutomaticAppCreate`, `cartTransformCreate`  
**Metafields:** Namespace `bundle_discounts`, keys `cart_transform_config`/`discount_function_config`  
**Scopes:** `write_discounts,write_cart_transforms,write_products,write_metafields`  
**Limitation:** No direct collection queries in functions (pre-compute relationships)

## User Flow

**Path:** `/app` → Dashboard → Bundle Type Selection → Configuration → Publishing  
**Bundle Types:** Cart Transform (Plus) vs Discount Functions (All plans)  
**Configuration:** Multi-tab interface with step setup, discount settings, product/collection selection  
**State:** React/Remix + Prisma + Metafields

## Important TODOs

**High Priority:**
- Bundle creation error handling (`app/routes/app.bundles.create.tsx:22,40`)
- Product status sync via GraphQL (`configure.$bundleId.tsx:1230`)

**Medium Priority:**  
- Collection-based bundle matching optimization
- Advanced analytics dashboard
- Comprehensive test coverage

## Implementation Status ✅

**Dual Bundle System:** Cart Transform + Discount Functions with separate metafield configs  
**Enhanced UI:** Professional modals, interactive badges, save bar integration  
**File Organization:** Descriptive prefixes for clear separation  
**MCP Integration:** All GraphQL validated, type safety maintained

