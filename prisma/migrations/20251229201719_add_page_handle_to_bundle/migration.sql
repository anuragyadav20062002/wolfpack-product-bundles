-- AlterTable
ALTER TABLE "public"."Bundle" ADD COLUMN     "shopifyPageHandle" TEXT,
ADD COLUMN     "shopifyPageId" TEXT;

-- CreateIndex
CREATE INDEX "Bundle_shopifyPageHandle_idx" ON "public"."Bundle"("shopifyPageHandle");
