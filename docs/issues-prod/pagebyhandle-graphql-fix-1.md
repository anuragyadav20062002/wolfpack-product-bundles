# Issue: Fix GraphQL Query Errors

**Issue ID:** pagebyhandle-graphql-fix-1
**Status:** Completed
**Priority:** 🔴 High
**Created:** 2026-01-15
**Last Updated:** 2026-01-15 00:10

## Overview

Multiple GraphQL query errors were identified and fixed:

### Error 1: pageByHandle (Admin API)
When clicking "Add to storefront" in the full-page bundle configure route, users see the error:
```
Failed to create page: Field 'pageByHandle' doesn't exist on type 'QueryRoot'
```

### Error 2: collections query variable type (Storefront API)
The storefront collections API endpoint had an incorrect variable type:
```
Variable "$handles" of type "[String!]!" used in position expecting type "String"
```

## Root Cause

### Error 1: pageByHandle
In `app/services/widget-installation.server.ts` at line 641-656, the `createFullPageBundle` method uses:
```graphql
query getPageByHandle($handle: String!) {
  pageByHandle(handle: $handle) {
    id
    title
    handle
  }
}
```

However, Shopify's Admin GraphQL API does NOT have a `pageByHandle` query. The available queries are:
- `page(id: ID!)` - Get page by ID
- `pages(query: String, ...)` - List pages with optional search query

### Error 2: collections query
In `app/routes/api.storefront-collections.tsx` at lines 32-33 and 97:
```graphql
query getCollectionProducts($handles: [String!]!) {
  collections(first: 10, query: $handles) {
```
The `query` parameter expects `String`, not `[String!]!`.

## Solution

### Fix 1: pageByHandle
Replace the `pageByHandle` query with a `pages` query using the `query` parameter to filter by handle:
```graphql
query getPageByHandle($query: String!) {
  pages(first: 1, query: $query) {
    edges {
      node {
        id
        title
        handle
      }
    }
  }
}
```

Called with: `{ query: "handle:bundle-xxx" }`

### Fix 2: collections query
Change the variable type and name:
```graphql
query getCollectionProducts($query: String!) {
  collections(first: 10, query: $query) {
```
And update the variables object from `{ handles: [queryFilter] }` to `{ query: queryFilter }`

## Progress Log

### 2026-01-15 00:00 - Issue Identified
- Error toast: "Failed to create page: Field 'pageByHandle' doesn't exist on type 'QueryRoot'"
- Root cause: Invalid GraphQL query in `widget-installation.server.ts:641-656`
- Solution: Use `pages` query with handle filter instead
- Next: Implement the fix

### 2026-01-15 00:05 - Fix 1 Implemented (pageByHandle)
- ✅ Replaced `pageByHandle` query with `pages(first: 1, query: $query)` query
- ✅ Updated variable from `handle: pageHandle` to `query: "handle:${pageHandle}"`
- ✅ Updated response parsing from `checkData.data?.pageByHandle` to `checkData.data?.pages?.edges?.[0]?.node || null`
- ✅ Validated fix against Shopify Admin GraphQL schema - SUCCESS
- Files modified: `app/services/widget-installation.server.ts` (lines 640-660)

### 2026-01-15 00:10 - Fix 2 Implemented (collections query)
- ✅ Changed variable type from `$handles: [String!]!` to `$query: String!`
- ✅ Updated variables object from `{ handles: [queryFilter] }` to `{ query: queryFilter }`
- ✅ Validated fix against Shopify Storefront GraphQL schema - SUCCESS
- Files modified: `app/routes/api.storefront-collections.tsx` (lines 32, 97)

### 2026-01-15 00:10 - Additional Verification
- ✅ Verified `pages` and `themes` queries using `nodes` are VALID (Admin API supports both `nodes` and `edges`)
- No additional fixes required for `app.bundles.full-page-bundle.configure.$bundleId.tsx`

## Related Documentation
- Shopify Admin GraphQL API: pages query
- Shopify Storefront GraphQL API: collections query
- Files modified:
  - `app/services/widget-installation.server.ts`
  - `app/routes/api.storefront-collections.tsx`

## Phases Checklist
- [x] Phase 1: Identify root cause
- [x] Phase 2: Implement fixes
- [x] Phase 3: Validate with Shopify schema
- [ ] Phase 4: Test in storefront
