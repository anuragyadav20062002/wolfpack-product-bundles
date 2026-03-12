-- Add 'unlisted' value to BundleStatus enum
-- Required for ad-campaign bundles that should not appear in the storefront
-- but are accessible via direct URL / UTM links.
-- IF NOT EXISTS prevents failure if the migration is run twice.

ALTER TYPE "BundleStatus" ADD VALUE IF NOT EXISTS 'unlisted';
