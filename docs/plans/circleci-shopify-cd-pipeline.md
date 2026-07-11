# CircleCI Shopify CI/CD Pipeline Plan

**Created:** 2026-07-11  
**Status:** Planned, not implemented  
**Scope:** CircleCI pipeline for the Remix app, Render web/worker deployments, Shopify app extension deploys, and Shopify App Automation Token rotation.

## Goals

- Add a CircleCI pipeline that matches this repo's actual deployment shape.
- Deploy SIT from `STAGING` and production from `PROD`.
- Trigger Render deploys for both the app server and webhook worker before releasing Shopify app versions.
- Use Shopify App Automation Tokens for non-interactive `shopify app deploy`.
- Keep deployment backfill disabled in CI.
- Add a 1Password-backed rotation process for `SHOPIFY_APP_AUTOMATION_TOKEN`.

## Current Repo Facts

- Runtime is Node `>=22 <23`.
- Shopify deploy scripts already exist:
  - `npm run deploy:sit`
  - `npm run deploy:prod`
- Those deploy scripts call `deployment:backfill`, then build Rust extensions, then run Shopify CLI deploy.
- `deployment:backfill` is disabled unless explicit environment flags enable it.
- App server health check exists at `/health` and verifies database connectivity.
- Webhook worker health check also exists at `/health`.
- Current GitHub Actions only enforce branch merge direction. They do not build, test, or deploy.
- Full TypeScript and full unit test gates are not currently clean, so the first CI version should use stable gates and leave stricter gates as a follow-up.

## Branch Mapping

| Branch | Environment | Shopify config | Render services |
|---|---|---|---|
| `STAGING` | SIT | `shopify.app.wolfpack-product-bundles-sit.toml` | SIT web + SIT webhook worker |
| `PROD` | Production | `shopify.app.toml` | Production web + production webhook worker |

## Pipeline Shape

### Pull Request CI

Run on all pull requests:

1. Install dependencies with npm cache.
2. Run ESLint with existing warning tolerance:
   ```bash
   npx eslint --max-warnings 9999 .
   ```
3. Run stable unit suites only:
   ```bash
   npx jest --selectProjects unit --testPathPattern='tests/unit/(services|extensions)' --runInBand
   ```
4. Run app build:
   ```bash
   npm run build
   ```

Do not block the first pipeline on `npx tsc --noEmit` or full `npm run test:unit` until the existing failures are fixed.

### SIT Deploy

Run only after merge to `STAGING`:

1. Install dependencies.
2. Run the same stable CI gates.
3. Build deploy assets:
   ```bash
   npm run build:widgets
   npm run minify:assets css
   ```
4. Build Rust Shopify Functions:
   ```bash
   cd extensions/bundle-cart-transform-rs && cargo build --release --target wasm32-unknown-unknown
   cd extensions/bundle-discount-function && cargo build --release --target wasm32-unknown-unknown
   ```
5. Trigger SIT Render web deploy hook.
6. Trigger SIT Render webhook worker deploy hook.
7. Wait for:
   - `https://wolfpack-product-bundle-app-sit.onrender.com/health`
   - `https://wolfpack-staging-pubsub-worker.onrender.com/health`
8. Run Shopify deploy using the SIT config:
   ```bash
   SHOPIFY_APP_AUTOMATION_TOKEN="$(op read "$OP_SHOPIFY_TOKEN_REF")" \
     shopify app deploy --config shopify.app.wolfpack-product-bundles-sit.toml --allow-updates
   ```

### Production Deploy

Run only after merge to `PROD`:

1. Install dependencies.
2. Run the same stable CI gates.
3. Build deploy assets:
   ```bash
   npm run build:widgets
   npm run minify:assets css
   ```
4. Build Rust Shopify Functions.
5. Trigger production Render web deploy hook.
6. Trigger production Render webhook worker deploy hook.
7. Wait for:
   - `https://wolfpack-product-bundle-app.onrender.com/health`
   - `https://wolfpack-production-webhook-processor.onrender.com/health`
8. Run Shopify deploy using production config:
   ```bash
   SHOPIFY_APP_AUTOMATION_TOKEN="$(op read "$OP_SHOPIFY_TOKEN_REF")" \
     shopify app deploy --config shopify.app.toml --allow-updates
   ```

Do not use `--allow-deletes` in normal CI. Removal of Shopify app extensions should remain a deliberate release action.

## CircleCI Contexts

Create two CircleCI contexts.

### `wolfpack-sit-deploy`

Required environment variables:

| Variable | Purpose |
|---|---|
| `OP_SERVICE_ACCOUNT_TOKEN` | 1Password service account token with read access to the SIT deploy token item |
| `OP_SHOPIFY_TOKEN_REF` | 1Password secret reference for the SIT `SHOPIFY_APP_AUTOMATION_TOKEN` |
| `RENDER_WEB_DEPLOY_HOOK_URL` | SIT app server deploy hook |
| `RENDER_WORKER_DEPLOY_HOOK_URL` | SIT webhook worker deploy hook |
| `RENDER_WEB_HEALTH_URL` | SIT app server health URL |
| `RENDER_WORKER_HEALTH_URL` | SIT webhook worker health URL |

### `wolfpack-prod-deploy`

Required environment variables:

| Variable | Purpose |
|---|---|
| `OP_SERVICE_ACCOUNT_TOKEN` | 1Password service account token with read access to the production deploy token item |
| `OP_SHOPIFY_TOKEN_REF` | 1Password secret reference for the production `SHOPIFY_APP_AUTOMATION_TOKEN` |
| `RENDER_WEB_DEPLOY_HOOK_URL` | Production app server deploy hook |
| `RENDER_WORKER_DEPLOY_HOOK_URL` | Production webhook worker deploy hook |
| `RENDER_WEB_HEALTH_URL` | Production app server health URL |
| `RENDER_WORKER_HEALTH_URL` | Production webhook worker health URL |

## 1Password Token Items

Create one 1Password item per environment.

Required fields:

| Field | Example | Purpose |
|---|---|---|
| `SHOPIFY_APP_AUTOMATION_TOKEN` | secret value | Token consumed by Shopify CLI |
| `expires_at` | `2026-10-01` | Date used by scheduled expiry checks |
| `shopify_app_handle` | `wolfpack-product-bundles` | Human verification field |
| `environment` | `production` or `sit` | Human verification field |

The CircleCI job should read only the secret field needed for deploy:

```bash
export SHOPIFY_APP_AUTOMATION_TOKEN="$(op read "$OP_SHOPIFY_TOKEN_REF")"
```

## Token Rotation Plan

Shopify App Automation Tokens are created and rotated inside the Shopify Dev Dashboard. The token value is visible only immediately after creation, and Shopify currently documents expiration choices of 1, 3, or 6 months.

Because Shopify does not expose a documented CLI/API path to create these tokens, the safe automated rotation plan is:

1. A scheduled CircleCI workflow runs daily.
2. It reads `expires_at` from the 1Password item.
3. It fails and alerts when the token expires within 21 days.
4. Operator rotates the token in Shopify Dev Dashboard.
5. Operator immediately updates the matching 1Password item with:
   - new `SHOPIFY_APP_AUTOMATION_TOKEN`
   - new `expires_at`
6. Next deploy automatically picks up the new token from 1Password.
7. Operator runs or waits for a successful SIT/prod deploy.
8. Operator revokes the old token in Shopify Dev Dashboard.

This gives automatic expiry detection and automatic deploy-time token pickup while keeping token generation/revocation aligned with Shopify's documented dashboard flow.

If Shopify later exposes documented token creation and revocation APIs, replace steps 4 and 8 with a CircleCI scheduled rotation job that:

1. Creates a new app automation token.
2. Writes it to the 1Password item.
3. Runs a Shopify CLI auth smoke test.
4. Triggers a no-op deploy validation where possible.
5. Revokes the old token only after validation passes.

## New Files To Add

### `.circleci/config.yml`

Expected jobs:

- `checkout_install`
- `lint`
- `stable_unit_tests`
- `build_app`
- `build_deploy_assets`
- `render_deploy`
- `wait_for_health`
- `shopify_deploy_sit`
- `shopify_deploy_prod`
- `token_expiry_check`

Expected workflows:

- `pull_request_ci`
- `deploy_sit_on_staging`
- `deploy_prod_on_prod`
- `daily_shopify_token_expiry_check`

### `scripts/ci/wait-for-health.sh`

Poll a health URL until it returns HTTP 200 or times out.

### `scripts/ci/check-shopify-token-expiry.sh`

Read `expires_at` from 1Password and fail when the token is within the configured warning window.

## Package Scripts To Add

```json
{
  "ci:lint": "eslint --max-warnings 9999 .",
  "ci:test:stable": "jest --selectProjects unit --testPathPattern='tests/unit/(services|extensions)' --runInBand",
  "ci:build": "npm run build",
  "ci:deploy-assets": "npm run build:widgets && npm run minify:assets css"
}
```

## Guardrails

- CI must not set:
  - `WPB_DEPLOYMENT_BACKFILL_ENABLED=true`
  - `WPB_DEPLOYMENT_BACKFILL_APPLY=true`
  - `WPB_CART_TRANSFORM_REPAIR_APPLY=true`
- CI must not run deployment backfill apply mode.
- CI must not run cart transform repair apply mode.
- Normal Shopify deploy must use `--allow-updates`, not `--allow-deletes`.
- Production deploys should only happen from `PROD`.
- SIT deploys should only happen from `STAGING`.
- The local agent should not run `shopify app deploy`; deploy execution belongs to the configured CI workflow or a human operator.

## Follow-Up Cleanup Before Stricter CI

Fix the existing failures before enabling full TypeScript and full unit-test gates:

- `npx tsc --noEmit`
- `npm run test:unit`

Known failing areas from the initial check:

- `tests/unit/routes/dashboard-lcp-loader.test.ts`
- webhook processor test mocks
- duplicated `mockDb` in webhook tests
- route/assets unit test failures

## Acceptance Criteria

- `.circleci/config.yml` exists and runs PR CI on all branches.
- Merge to `STAGING` deploys Render SIT web + worker, waits for health, then deploys Shopify SIT app config.
- Merge to `PROD` deploys Render production web + worker, waits for health, then deploys Shopify production app config.
- Shopify CLI authentication comes from `SHOPIFY_APP_AUTOMATION_TOKEN` read from 1Password at runtime.
- Scheduled token expiry workflow fails before token expiry and gives enough time to rotate.
- No CI job enables deployment backfill apply or cart transform repair apply.
- Existing GitHub branch-direction protections remain in place.

## References

- Shopify App Automation Tokens: https://shopify.dev/docs/apps/build/dev-dashboard/app-automation-tokens
- Shopify CLI deploy command: `shopify app deploy --help`
- 1Password service accounts with CLI: https://www.1password.dev/service-accounts/use-with-1password-cli/
