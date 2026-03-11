-- AlterTable
ALTER TABLE "Bundle" ADD COLUMN "inventorySyncedAt" TIMESTAMP(3),
                     ADD COLUMN "inventoryStaleAt"  TIMESTAMP(3);
