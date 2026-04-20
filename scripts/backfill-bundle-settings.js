#!/usr/bin/env node

/**
 * Backfill `custom:bundle_settings` page metafield for all existing FPB bundles.
 *
 * Run this ONCE on prod immediately after deploying the bundle_config/bundle_settings split.
 * The widget no longer reads settings from bundle_config — it expects bundle_settings.
 *
 * Usage:
 *   node scripts/backfill-bundle-settings.js            # live run
 *   node scripts/backfill-bundle-settings.js --dry-run  # preview only, no writes
 *
 * Requirements:
 *   - DATABASE_URL must be set (loaded from prisma/.env automatically)
 *   - Shopify offline sessions must exist for each shop in the Session table
 *   - Node 18+ (uses native fetch)
 *
 * Rate limiting: 1 request per 600ms — safely within Shopify's 40 req/s leaky bucket.
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// ---------------------------------------------------------------------------
// Load DATABASE_URL from prisma/.env if not already in environment
// ---------------------------------------------------------------------------

if (!process.env.DATABASE_URL) {
  try {
    const envContent = readFileSync(join(ROOT_DIR, 'prisma', '.env'), 'utf-8');
    for (const line of envContent.split('\n')) {
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) process.env[key] = val;
    }
  } catch {
    // prisma/.env not found — DATABASE_URL must be set externally
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DRY_RUN = process.argv.includes('--dry-run');
const SHOPIFY_API_VERSION = '2024-10';
const REQUEST_DELAY_MS = 600; // ~1.67 req/s, well within 40 req/s burst limit

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build the bundle_settings object from a raw Prisma bundle row. */
function buildBundleSettings(bundle) {
  return {
    promoBannerBgImage: bundle.promoBannerBgImage ?? null,
    promoBannerBgImageCrop: bundle.promoBannerBgImageCrop ?? null,
    loadingGif: bundle.loadingGif ?? null,
    showStepTimeline: bundle.showStepTimeline ?? null,
    floatingBadgeEnabled: bundle.floatingBadgeEnabled ?? false,
    floatingBadgeText: bundle.floatingBadgeText ?? '',
    tierConfig: bundle.tierConfig ?? null,
  };
}

const SET_METAFIELD_MUTATION = `
  mutation SetBundleSettingsMetafield($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id key }
      userErrors { field message }
    }
  }
`;

/** Write bundle_settings metafield to a Shopify page via Admin API. */
async function writeSettingsMetafield(shopDomain, accessToken, pageId, settings) {
  const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: SET_METAFIELD_MUTATION,
      variables: {
        metafields: [
          {
            ownerId: pageId,
            namespace: 'custom',
            key: 'bundle_settings',
            value: JSON.stringify(settings),
            type: 'json',
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from Shopify API`);
  }

  const data = await response.json();
  const userErrors = data.data?.metafieldsSet?.userErrors ?? [];
  if (userErrors.length > 0) {
    throw new Error(`Shopify userError: ${userErrors[0].message}`);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('');
    console.log('='.repeat(60));
    console.log(`  Bundle Settings Backfill${DRY_RUN ? '  [DRY RUN — no writes]' : ''}`);
    console.log('='.repeat(60));
    console.log('');

    // Fetch all FPB bundles with a live page
    const bundles = await prisma.bundle.findMany({
      where: {
        bundleType: 'full_page',
        shopifyPageId: { not: null },
      },
      select: {
        id: true,
        shopId: true,
        shopifyPageId: true,
        promoBannerBgImage: true,
        promoBannerBgImageCrop: true,
        loadingGif: true,
        showStepTimeline: true,
        floatingBadgeEnabled: true,
        floatingBadgeText: true,
        tierConfig: true,
      },
    });

    console.log(`  Found ${bundles.length} full-page bundles with live pages`);
    console.log('');

    if (bundles.length === 0) {
      console.log('  Nothing to backfill.');
      return;
    }

    // Fetch offline sessions for all shops in one query
    const shopIds = [...new Set(bundles.map((b) => b.shopId))];
    const sessions = await prisma.session.findMany({
      where: {
        shop: { in: shopIds },
        isOnline: false,
      },
      select: { shop: true, accessToken: true },
    });

    const sessionMap = new Map(sessions.map((s) => [s.shop, s.accessToken]));
    console.log(`  Found offline sessions for ${sessionMap.size} / ${shopIds.length} shops`);
    console.log('');

    let ok = 0;
    let failed = 0;
    let skipped = 0;

    for (const bundle of bundles) {
      const accessToken = sessionMap.get(bundle.shopId);

      if (!accessToken) {
        console.log(`  [SKIP] ${bundle.id}  (${bundle.shopId}) — no offline session`);
        skipped++;
        continue;
      }

      const settings = buildBundleSettings(bundle);

      if (DRY_RUN) {
        const preview = JSON.stringify(settings).slice(0, 100);
        console.log(`  [DRY]  ${bundle.id}  (${bundle.shopId})  →  ${preview}…`);
        ok++;
        continue;
      }

      try {
        await writeSettingsMetafield(bundle.shopId, accessToken, bundle.shopifyPageId, settings);
        console.log(`  [OK]   ${bundle.id}  (${bundle.shopId})`);
        ok++;
      } catch (err) {
        console.error(`  [FAIL] ${bundle.id}  (${bundle.shopId})  —  ${err.message}`);
        failed++;
      }

      await sleep(REQUEST_DELAY_MS);
    }

    console.log('');
    console.log('-'.repeat(60));
    console.log(`  OK: ${ok}   Failed: ${failed}   Skipped: ${skipped}`);
    console.log('='.repeat(60));
    console.log('');

    if (failed > 0) process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[backfill-bundle-settings] Fatal error:', err);
  process.exit(1);
});
