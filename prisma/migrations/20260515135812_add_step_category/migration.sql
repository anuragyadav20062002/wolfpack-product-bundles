-- CreateTable
CREATE TABLE "StepCategory" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "products" JSONB,
    "collections" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StepCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StepCategory_stepId_idx" ON "StepCategory"("stepId");

-- CreateIndex
CREATE INDEX "StepCategory_stepId_sortOrder_idx" ON "StepCategory"("stepId", "sortOrder");

-- AddForeignKey
ALTER TABLE "StepCategory" ADD CONSTRAINT "StepCategory_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "BundleStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
