-- Reset showProgressBar to false for all existing bundles (feature off by default for existing merchants)
-- and change the column default so new bundles also start with it off.
UPDATE "BundlePricing" SET "showProgressBar" = false;
ALTER TABLE "BundlePricing" ALTER COLUMN "showProgressBar" SET DEFAULT false;
