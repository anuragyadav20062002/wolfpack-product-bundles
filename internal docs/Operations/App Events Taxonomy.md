---
title: Shopify App Events Taxonomy
type: operations
last_audited: 2026-06-21
---

# Shopify App Events Taxonomy

## Purpose

This document defines the App Events WPB should emit to Shopify so the business can trace merchant behavior, feature adoption, abandonment points, and operational failures in the Shopify Dev Dashboard.

Shopify App Events are a server-side telemetry channel. They should not replace every client-side storefront event. The correct direction is one canonical event vocabulary with multiple sinks:

- Shopify App Events for merchant lifecycle, Admin configuration, sync/install operations, operational failures, and future usage-based billing meters.
- WPB internal analytics tables/endpoints for product analytics, longer retention, funnels, and storefront/customer journey analysis.
- Browser `wpb:*` CustomEvents for storefront theme, GTM, Klaviyo, Meta Pixel, and merchant-owned integrations.

## Shopify Source Constraints

Shopify's App Events docs define these constraints:

- Source references: [About App Events](https://shopify.dev/docs/apps/build/app-events) and [App Events API reference](https://shopify.dev/docs/api/app-events/latest).
- Events are sent one per request to `https://api.shopify.com/app/{API_VERSION}/events`; batch requests are not supported.
- Events are tied to a shop and appear in the Dev Dashboard under Logs and Monitoring.
- Events are retained by Shopify for 30 days.
- Custom events can track merchant behavior, operational health, errors, failures, friction points, page views, feature activation, resource creation, bulk operations, and scheduled tasks.
- Billing events can later power usage-based pricing, but their `event_handle` must match a configured meter handle.
- Do not include personal data or data that can identify an individual.
- Required fields are `shop_id`, `event_handle`, `timestamp`, `idempotency_key`, and `attributes`.
- `attributes` is limited to 15 scalar keys. Strings are limited to 128 UTF-8 characters. Arrays and nested objects are not supported.
- Use consistent `snake_case` event handles, accurate timestamps, structured attributes, separate behavior events from troubleshooting events, and unique idempotency keys.
- The API has a 500 requests/second/app rate limit. Use retries with backoff and avoid high-volume browser streams.
- Authentication uses the app's Dev Dashboard client ID/secret to request a short-lived bearer token from Shopify's App Events auth endpoint. This is separate from Shopify Admin offline access tokens and does not require an Admin API scope.

## Current WPB Telemetry

Current repo state has no Shopify App Events emitter.

Existing telemetry surfaces:

- `wpb:*` browser `CustomEvent`s are emitted by the full-page storefront widget.
- `/apps/product-bundles/api/attribution/engagement` accepts storefront engagement beacons and expects `wpb:*` event names.
- `/api/attribution` records checkout-completed UTM attribution from the Shopify Web Pixel.
- `/apps/product-bundles/api/widget-error` records storefront widget runtime errors.
- `extensions/wolfpack-utm-pixel` subscribes to Shopify Web Pixel customer events such as `page_viewed` and `checkout_completed`.

These surfaces serve storefront analytics and merchant integrations. App Events should be added alongside them for Dev Dashboard tracing and future billing meters.

## Event Design Rules

### Naming

- Use lower `snake_case`.
- Use past tense for completed actions: `bundle_created`, `widget_installed`.
- Use `_started` for long-running workflows: `bundle_sync_started`.
- Use `_failed` for failures: `bundle_sync_failed`.
- Use `_viewed` only for low-volume Admin views that identify merchant journey state.
- Do not use the reserved `shopify.` prefix.

### Common Attributes

Every custom App Event should include the relevant subset of these attributes. Do not exceed Shopify's 15-key `attributes` limit.

| Attribute | Purpose |
| --- | --- |
| `schema_version` | Event schema version, starting at `1`. |
| `shop_gid` | Shopify Shop GID when available. |
| `route_family` | Admin route family, such as `create_configure`, `fpb_configure`, `ppb_configure`, `settings`, `dashboard`, `cart_transform`. |
| `surface` | `admin`, `storefront`, `checkout`, `webhook`, `background_job`, `function`. |
| `actor` | `merchant`, `system`, `webhook`, `function`, `pixel`. |
| `bundle_id` | WPB bundle ID when the event is bundle-scoped. |
| `bundle_type` | `full_page` or `product_page`. |
| `correlation_id` | Stable ID linking started/succeeded/failed events in one workflow. |
| `request_id` | Request/log correlation ID when available. |
| `duration_ms` | Workflow duration for sync/install/API operations. |
| `result` | `success`, `failure`, `skipped`, or `partial`. |
| `error_code` | Stable machine-readable error category. |
| `error_message_safe` | Redacted, merchant-safe error summary. |

Never send access tokens, refresh tokens, emails, merchant names, shop domains, customer names, addresses, phone numbers, raw GraphQL responses, product titles, full page URLs with query strings, buyer/customer identifiers, arrays, or nested objects.

### Idempotency Key

Use deterministic keys for retryable operations and random keys for one-off observations:

- Workflow event: `{shop_id}:{event_handle}:{correlation_id}:{stage}`.
- Bundle mutation: `{shop_id}:{event_handle}:{bundle_id}:{updated_at_or_request_id}`.
- Billing meter event: a permanently unique key tied to the metered unit.

## Event Taxonomy

### Installation, Auth, and Onboarding

| Event | Sink | Fires When | Business Question |
| --- | --- | --- | --- |
| `app_installed` | App Events + internal | App installation completes and an offline/session token is stored. | How many installs reach a usable state? |
| `app_reauthorized` | App Events | OAuth reauthorization completes. | Are merchants repeatedly hitting auth friction? |
| `app_uninstalled` | App Events + internal | App uninstall webhook is processed. | What churn exists by plan/cohort? |
| `onboarding_started` | App Events + internal | Merchant reaches the first onboarding/create entry point. | How many installs start setup? |
| `onboarding_step_completed` | App Events + internal | Merchant completes a named onboarding step. | Where does onboarding drop off? |
| `onboarding_completed` | App Events + internal | Merchant completes setup and reaches a usable bundle. | What share reaches activation? |
| `proxy_health_check_failed` | App Events | App proxy validation fails. | Which installs have storefront connectivity issues? |
| `pixel_activation_failed` | App Events | Web Pixel activation/configuration fails. | Which stores cannot record attribution? |

Abandonment should generally be derived from the last completed step without a later completion event, not emitted as a synthetic event unless a timeout job exists.

### Create Bundle Journey

| Event | Sink | Fires When | Key Attributes |
| --- | --- | --- | --- |
| `bundle_create_started` | App Events + internal | Merchant starts create flow. | `bundle_type`, `entry_point` |
| `bundle_create_step_completed` | App Events + internal | Merchant completes a wizard step. | `step_key`, `step_index`, `bundle_type` |
| `bundle_created` | App Events + internal | Bundle DB record and required Shopify resources are created. | `bundle_id`, `bundle_type`, `template_id` |
| `bundle_create_failed` | App Events + internal | Create action fails before bundle is usable. | `step_key`, `error_code`, `error_message_safe` |
| `bundle_configure_started` | App Events + internal | Merchant lands in configure after create. | `bundle_id`, `bundle_type` |

Business funnel:

`bundle_create_started` -> `bundle_create_step_completed` for each step -> `bundle_created` -> `bundle_configure_started`.

Drop-off reports should group merchants by the final `bundle_create_step_completed.step_key` that lacks a later `bundle_created`.

### Configure, Save, and Feature Usage

| Event | Sink | Fires When | Key Attributes |
| --- | --- | --- | --- |
| `bundle_configure_viewed` | App Events + internal | Configure page loader succeeds. | `bundle_id`, `bundle_type`, `route_family` |
| `bundle_saved` | App Events + internal | Configure save succeeds. | `bundle_id`, `bundle_type`, `changed_sections` |
| `bundle_save_failed` | App Events + internal | Configure save action fails. | `bundle_id`, `intent`, `error_code` |
| `bundle_status_changed` | App Events + internal | Merchant activates/deactivates a bundle. | `bundle_id`, `new_status` |
| `bundle_previewed` | App Events + internal | Merchant previews a bundle for the first time after a preview/product/page link is available. | `bundle_id`, `bundle_type`, `bundle_status`, `bundle_link` |
| `template_selected` | App Events + internal | Merchant saves a template/preset change. | `bundle_id`, `template_id`, `preset_id` |
| `pricing_configured` | App Events + internal | Merchant saves pricing/discount configuration. | `bundle_id`, `pricing_mode`, `discount_type` |
| `visibility_configured` | App Events + internal | Merchant saves visibility/display rules. | `bundle_id`, `visibility_mode` |
| `language_configured` | App Events + internal | Merchant saves text/language settings. | `bundle_id`, `locale_key_count` |
| `custom_css_saved` | App Events + internal | Merchant saves custom CSS. | `bundle_id`, `css_size_bucket` |

Feature adoption reports should count unique shops and bundles by feature events, not raw save volume alone.

### Sync, Products, Templates, and Widget Installation

| Event | Sink | Fires When | Key Attributes |
| --- | --- | --- | --- |
| `bundle_sync_started` | App Events + internal | Merchant starts Sync Bundle. | `bundle_id`, `bundle_type`, `correlation_id` |
| `bundle_synced` | App Events + internal | Sync completes successfully. | `bundle_id`, `duration_ms`, `resources_synced` |
| `bundle_sync_failed` | App Events + internal | Sync fails or partially fails. | `bundle_id`, `error_code`, `failed_stage` |
| `bundle_product_synced` | App Events | Product/metafield sync succeeds. | `bundle_id`, `product_gid` |
| `bundle_product_sync_failed` | App Events | Product/metafield sync fails. | `bundle_id`, `error_code` |
| `preview_page_created` | App Events | FPB preview/page creation succeeds. | `bundle_id`, `page_gid` |
| `preview_page_create_failed` | App Events | FPB preview/page creation fails. | `bundle_id`, `error_code` |
| `widget_install_started` | App Events + internal | Merchant starts widget/theme installation flow. | `bundle_id`, `placement` |
| `widget_installed` | App Events + internal | Widget placement is confirmed. | `bundle_id`, `placement`, `theme_gid` |
| `widget_install_failed` | App Events + internal | Widget installation or validation fails. | `bundle_id`, `placement`, `error_code` |
| `widget_setup_validated` | App Events | App confirms required storefront setup exists. | `bundle_id`, `placement` |
| `widget_setup_missing` | App Events | Required storefront setup is missing. | `bundle_id`, `missing_piece` |
| `product_template_assigned` | App Events | PPB product template assignment succeeds. | `bundle_id`, `template_id` |
| `template_check_failed` | App Events | Theme/template validation fails. | `bundle_id`, `error_code` |

Operational debugging should start with `bundle_sync_failed`, `widget_install_failed`, `widget_setup_missing`, and `template_check_failed` filtered by shop.

### Storefront Runtime

Most storefront runtime events are customer-side and can be high volume. They should stay in internal analytics and browser `wpb:*` events by default. Only low-volume operational failures should go to Shopify App Events.

| Event | Sink | Fires When | Notes |
| --- | --- | --- | --- |
| `bundle_widget_rendered` | Internal + `wpb:*` | Widget mounts and is usable. | Do not emit every render to App Events unless sampled. |
| `bundle_widget_render_failed` | App Events + internal | Widget cannot render because config/assets failed. | Suitable Dev Dashboard failure event. |
| `widget_runtime_error_reported` | App Events + internal | `/api/widget-error` receives a runtime error. | Redact message and stack. |
| `widget_config_load_failed` | App Events + internal | Metafield and proxy config loading both fail. | Key operational failure. |
| `bundle_view_recorded` | Internal + `wpb:*` | Customer views bundle. | Too high volume for default App Events. |
| `bundle_engaged` | Internal + `wpb:*` | Customer first interacts with bundle in session. | Keep in `BundleEngagement`. |
| `bundle_add_to_cart_attempted` | Internal + `wpb:*` | Customer starts add-to-cart. | Customer event, not Dev Dashboard default. |
| `bundle_add_to_cart_succeeded` | Internal + `wpb:*` | Add-to-cart succeeds. | Product analytics sink. |
| `bundle_add_to_cart_failed` | Internal + `wpb:*`; App Events for sampled/systemic failures | Add-to-cart fails. | Emit App Event only if server-visible or sampled. |

### Cart Transform and Checkout

| Event | Sink | Fires When | Key Attributes |
| --- | --- | --- | --- |
| `cart_transform_enabled` | App Events + internal | Cart Transform configuration becomes active for a shop. | `function_id`, `cart_transform_id` |
| `cart_transform_setup_failed` | App Events + internal | Install or reauthorization setup cannot activate Cart Transform. | `error_code`, `error_message_safe` |
| `cart_transform_function_error` | App Events + internal | Function execution/logging path surfaces an error. | `error_code`, `bundle_type` |
| `cart_transform_merge_skipped` | Internal, sampled App Events only | Function intentionally skips a merge. | High volume; use carefully. |
| `addon_discount_function_enabled` | App Events + internal | Add-on Discount Function automatic app discount becomes active for a shop. | `discount_id`, `function_id`, `already_exists` |
| `addon_discount_function_failed` | App Events + internal | Add-on Discount Function setup fails. | `error_code`, `error_message_safe` |
| `checkout_extension_rendered` | Internal, sampled App Events only | Checkout extension renders. | High volume; sampled App Events only. |
| `checkout_extension_render_failed` | App Events + internal | Checkout extension fails to render or initialize. | `error_code`, `extension_target` |

### Attribution and Analytics

| Event | Sink | Fires When | Key Attributes |
| --- | --- | --- | --- |
| `pixel_enabled` | App Events + internal | Web Pixel is connected/enabled. | `pixel_id` |
| `pixel_disabled` | App Events + internal | Web Pixel is disconnected/disabled. | `pixel_id` |
| `pixel_activation_failed` | App Events + internal | Pixel activation fails. | `error_code` |
| `attribution_received` | Internal | `/api/attribution` receives checkout attribution payload. | High-volume; internal only by default. |
| `attribution_recorded` | Internal | Attribution row is created. | Internal analytics retention. |
| `attribution_failed` | App Events + internal | Attribution endpoint fails to validate/write. | `error_code` |
| `engagement_recorded` | Internal | Engagement beacon is persisted. | Internal funnel analytics. |
| `engagement_failed` | App Events + internal | Engagement beacon validation/write fails. | `error_code` |

### Pricing, Billing, and Limits

| Event | Sink | Fires When | Key Attributes |
| --- | --- | --- | --- |
| `pricing_limit_hit` | App Events + internal | Merchant reaches a plan/usage limit. | `limit_key`, `plan`, `current_value`, `limit_value` |
| `upgrade_prompt_viewed` | App Events + internal | Merchant is shown an upgrade prompt. | `limit_key`, `surface` |
| `billing_upgrade_started` | App Events + internal | Merchant starts plan upgrade. | `from_plan`, `to_plan` |
| `billing_upgraded` | App Events + internal | Upgrade completes. | `from_plan`, `to_plan` |
| `billing_upgrade_failed` | App Events + internal | Upgrade flow fails. | `error_code` |
| `billing_cancel_started` | App Events + internal | Merchant starts cancellation. | `plan` |
| `billing_cancelled` | App Events + internal | Cancellation completes. | `plan` |
| `subscription_webhook_processed` | App Events | Subscription webhook is processed. | `topic`, `status` |
| `subscription_webhook_failed` | App Events | Subscription webhook fails. | `topic`, `error_code` |

If usage-based billing is introduced, billing meter event handles must exactly match Shopify pricing configuration. Keep billing meter handles separate from behavioral handles.

### Files and Media

| Event | Sink | Fires When | Key Attributes |
| --- | --- | --- | --- |
| `store_file_uploaded` | App Events + internal | Merchant uploads media/file successfully. | `file_type`, `size_bucket` |
| `store_file_upload_failed` | App Events + internal | File upload fails. | `file_type`, `size_bucket`, `error_code` |
| `bundle_media_synced` | App Events | Bundle media sync succeeds. | `bundle_id`, `media_count` |
| `bundle_media_sync_failed` | App Events | Bundle media sync fails. | `bundle_id`, `error_code` |

## Flow Reference for Dev Dashboard Tracing

### New Merchant Activation

Expected sequence:

1. `app_installed`
2. `onboarding_started`
3. `bundle_create_started`
4. `bundle_create_step_completed` for each wizard step
5. `bundle_created`
6. `bundle_configure_started`
7. `bundle_saved`
8. `widget_install_started`
9. `widget_installed`
10. Optional: `bundle_synced`

Business interpretation:

- Last event is `app_installed`: merchant installed but never engaged.
- Last event is `onboarding_started`: onboarding copy/entry point is not converting.
- Last event is a specific `bundle_create_step_completed`: create wizard drop-off at the next step.
- `bundle_created` without `widget_installed`: merchant created a bundle but did not complete storefront setup.
- `widget_install_failed` or `widget_setup_missing`: setup blocker, likely support opportunity.

### Existing Merchant Configure and Sync

Expected sequence:

1. `bundle_configure_viewed`
2. One or more feature events such as `pricing_configured`, `template_selected`, `visibility_configured`
3. `bundle_saved`
4. Optional: `bundle_sync_started`
5. `bundle_synced` or `bundle_sync_failed`

Business interpretation:

- High `bundle_configure_viewed` with low `bundle_saved`: configure surface may be confusing or performance may be poor.
- Repeated `bundle_save_failed`: validation or backend issue.
- Repeated `bundle_sync_failed` grouped by `failed_stage`: Shopify API/theme/metafield reliability issue.

### Storefront Health

Expected sequence:

1. `bundle_widget_rendered` in internal analytics, not default App Events.
2. `bundle_engaged` in internal analytics.
3. `bundle_add_to_cart_succeeded` or `bundle_add_to_cart_failed` in internal analytics.
4. App Events only for `bundle_widget_render_failed`, `widget_config_load_failed`, `widget_runtime_error_reported`, or sampled systemic add-to-cart failures.

Business interpretation:

- Storefront funnel metrics come from internal analytics because Dev Dashboard retention is short and App Events are not a browser integration channel.
- Dev Dashboard should answer operational questions: "Which shops are broken right now?" and "Did a deploy increase runtime failures?"

### Cart Transform and Checkout Health

Expected sequence:

1. `cart_transform_enabled`
2. Setup failure path: `cart_transform_setup_failed`
3. Runtime error path: `cart_transform_function_error`
4. Checkout path: `checkout_extension_rendered` internally, `checkout_extension_render_failed` in App Events

Business interpretation:

- `cart_transform_setup_failed` is a high-priority support signal during install or reauthorization.
- `checkout_extension_render_failed` identifies checkout placement/runtime issues.

### Limit and Upgrade Funnel

Expected sequence:

1. `pricing_limit_hit`
2. `upgrade_prompt_viewed`
3. `billing_upgrade_started`
4. `billing_upgraded` or `billing_upgrade_failed`

Business interpretation:

- `pricing_limit_hit` with no `upgrade_prompt_viewed`: product did not surface monetization at the right moment.
- `upgrade_prompt_viewed` with no `billing_upgrade_started`: offer/copy/UX issue.
- `billing_upgrade_started` with `billing_upgrade_failed`: billing integration issue.

## App Events vs `wpb:*` CustomEvents

Do not decommission `wpb:*` CustomEvents solely because App Events exist.

`wpb:*` events are browser-local storefront integration events. They allow themes, GTM, Klaviyo, Meta Pixel, and merchant scripts to observe customer interactions in real time. They also support the current engagement beacon path.

Shopify App Events are server-side shop-scoped records for Dev Dashboard troubleshooting and possible billing meters. They have 30-day retention and are not a replacement for browser integration contracts or long-retention product analytics.

Recommended migration path:

1. Define this taxonomy as the canonical semantic vocabulary.
2. Add a server-side `emitAppEvent()` service for Shopify App Events.
3. Add or reuse an internal `recordBusinessEvent()` sink for analytics retention and dashboard funnels.
4. Map existing `wpb:*` storefront events to equivalent internal semantic names where helpful.
5. Keep `wpb:*` as a public storefront integration surface until every known external consumer has a supported replacement.
6. Decommission only duplicate internal-only `wpb:*` usage after the semantic event sink proves stable.

In short: App Events can drive Dev Dashboard observability and future billing meters. They should not be the only analytics store, and they cannot fully replace `wpb:*` storefront events.

## V1 Implementation

Implemented module:

- `app/services/app-events.server.ts`
- `recordBusinessEvent(input)` persists a redacted internal `BusinessEvent` row first.
- `emitShopifyAppEvent(input)` sends eligible events to Shopify App Events when enabled.
- `ensureShopIdentity(admin, shopDomain)` caches Shopify's Shop GID on `Shop.shopifyShopGid`.
- `getCachedShopifyShopGid(shopDomain)` lets webhook handlers use the cached Shop GID without Admin API access.

Database support:

- `Shop.shopifyShopGid String?`
- `BusinessEvent` stores canonical event handles, shop/domain context, optional bundle context, surface/actor/route context, redacted scalar attributes, deterministic idempotency keys, occurrence time, and Shopify delivery status/error metadata.

Environment controls:

| Env var | Required | Purpose |
| --- | --- | --- |
| `SHOPIFY_APP_EVENTS_ENABLED=true` | Yes for Shopify delivery | Enables outbound App Events delivery. Internal `BusinessEvent` persistence works without it. |
| `SHOPIFY_APP_EVENTS_API_VERSION` | No | Defaults to `unstable`; set a stable App Events API version when Shopify provides one for this app. |
| `SHOPIFY_API_KEY` | Yes for Shopify delivery | Client ID for the App Events client-credentials token request. |
| `SHOPIFY_API_SECRET` | Yes for Shopify delivery | Client secret for the App Events client-credentials token request. |

Delivery behavior:

- Shopify delivery is disabled by default.
- App Events auth uses `https://api.shopify.com/auth/access_token`; Admin offline access tokens are not used.
- Event POSTs target `https://api.shopify.com/app/{SHOPIFY_APP_EVENTS_API_VERSION}/events`.
- `409`, `429`, and `5xx` responses retry with bounded backoff.
- `400`, `401`, and `403` mark delivery failed without throwing into merchant flows.
- Attributes are limited to 15 scalar keys. Strings are truncated to 128 UTF-8 bytes. Identifying keys such as email, phone, address, customer, buyer, merchant, token, secret, stack, URL, domain, and name are dropped.
- Idempotency keys are deterministic and capped at Shopify's 64-character limit.

Implemented v1 emitted events:

| Area | Events |
| --- | --- |
| Auth lifecycle | `app_installed`, `app_reauthorized`, `pixel_activation_failed`, `cart_transform_enabled`, `cart_transform_setup_failed` |
| Uninstall webhook | `app_uninstalled` |
| Create bundle | `bundle_create_started`, `pricing_limit_hit`, `bundle_created`, `bundle_create_failed` |
| Create configure | `bundle_create_step_completed`, `pricing_configured`, `bundle_saved` |
| Sync | `bundle_sync_started`, `bundle_synced`, `bundle_sync_failed` |
| Storefront runtime | `widget_runtime_error_reported`, internal-only `bundle_engaged`, internal-only `engagement_failed` |
| Billing APIs | `billing_upgrade_started`, `billing_upgraded`, `billing_upgrade_failed`, `billing_cancel_started`, `billing_cancelled`, `billing_cancel_failed` |
| Subscription webhooks | `subscription_webhook_processed`, `subscription_webhook_failed` |

Dev Dashboard tracing recipes:

- Install health: filter `app_installed`, `app_reauthorized`, `pixel_activation_failed`, and `cart_transform_enabled` by shop.
- Create funnel: `bundle_create_started` -> `bundle_created` or `bundle_create_failed`, then inspect `bundle_create_step_completed.step_key`.
- Monetization: `pricing_limit_hit` -> `billing_upgrade_started` -> `billing_upgraded` or `billing_upgrade_failed`.
- Sync reliability: group `bundle_sync_failed` by `bundle_type`, `route_family`, and `error_code`.
- Storefront breakage: filter `widget_runtime_error_reported` by `bundle_type` and `category`.
