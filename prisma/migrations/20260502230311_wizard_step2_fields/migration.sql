-- AlterTable
ALTER TABLE "Bundle" ADD COLUMN     "searchBarEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "BundleStep" ADD COLUMN     "filters" JSONB,
ADD COLUMN     "pageTitle" TEXT;
