-- AlterTable
ALTER TABLE "public"."Bundle" ADD COLUMN     "loadingGif" TEXT;

-- AlterTable
ALTER TABLE "public"."BundleStep" ADD COLUMN     "conditionOperator2" TEXT,
ADD COLUMN     "conditionValue2" INTEGER;
