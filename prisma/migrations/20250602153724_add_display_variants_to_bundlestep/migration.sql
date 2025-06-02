-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BundleStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT DEFAULT 'box',
    "position" INTEGER NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxQuantity" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "productCategory" TEXT,
    "collections" TEXT,
    "products" TEXT,
    "displayVariantsAsIndividual" BOOLEAN NOT NULL DEFAULT false,
    "conditionType" TEXT,
    "conditionValue" INTEGER,
    "bundleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BundleStep_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BundleStep" ("bundleId", "collections", "createdAt", "enabled", "icon", "id", "maxQuantity", "minQuantity", "name", "position", "productCategory", "products", "updatedAt") SELECT "bundleId", "collections", "createdAt", "enabled", "icon", "id", "maxQuantity", "minQuantity", "name", "position", "productCategory", "products", "updatedAt" FROM "BundleStep";
DROP TABLE "BundleStep";
ALTER TABLE "new_BundleStep" RENAME TO "BundleStep";
CREATE INDEX "BundleStep_bundleId_idx" ON "BundleStep"("bundleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
