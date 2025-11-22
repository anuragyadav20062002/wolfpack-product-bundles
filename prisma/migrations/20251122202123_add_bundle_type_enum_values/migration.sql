-- Add new enum values to BundleType
-- These values must be committed before they can be used in subsequent migrations
ALTER TYPE "BundleType" ADD VALUE IF NOT EXISTS 'product_page';
ALTER TYPE "BundleType" ADD VALUE IF NOT EXISTS 'full_page';
