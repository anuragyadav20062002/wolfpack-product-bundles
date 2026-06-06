-- CreateTable
CREATE TABLE "BundleCustomField" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'text',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundleCustomField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BundleCustomField_bundleId_idx" ON "BundleCustomField"("bundleId");

-- CreateIndex
CREATE INDEX "BundleCustomField_bundleId_position_idx" ON "BundleCustomField"("bundleId", "position");

-- AddForeignKey
ALTER TABLE "BundleCustomField" ADD CONSTRAINT "BundleCustomField_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
