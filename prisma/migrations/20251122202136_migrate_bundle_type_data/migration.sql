-- Step 1: Migrate existing data from 'cart_transform' to 'product_page'
-- All existing bundles are product-page bundles (widget embedded in product page)
UPDATE "Bundle"
SET "bundleType" = 'product_page'::public."BundleType"
WHERE "bundleType" = 'cart_transform'::public."BundleType";

-- Step 2: Create a new enum without cart_transform
CREATE TYPE "BundleType_new" AS ENUM ('product_page', 'full_page');

-- Step 3: Alter the column to use the new enum
ALTER TABLE "Bundle" ALTER COLUMN "bundleType" DROP DEFAULT;
ALTER TABLE "Bundle" ALTER COLUMN "bundleType" TYPE "BundleType_new" 
  USING ("bundleType"::text::"BundleType_new");
ALTER TABLE "Bundle" ALTER COLUMN "bundleType" SET DEFAULT 'product_page';

-- Step 4: Drop the old enum and rename the new one
DROP TYPE "BundleType";
ALTER TYPE "BundleType_new" RENAME TO "BundleType";

-- Step 5: Verification - Check that all bundles now have valid bundleType values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Bundle"
    WHERE "bundleType" NOT IN ('product_page', 'full_page')
  ) THEN
    RAISE EXCEPTION 'Migration failed: Some bundles still have invalid bundleType values';
  END IF;
END $$;
