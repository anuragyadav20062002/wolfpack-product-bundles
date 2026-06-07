-- CreateTable
CREATE TABLE "AdminWebVital" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "rating" TEXT NOT NULL,
    "navType" TEXT,
    "deviceType" TEXT,
    "appVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminWebVital_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminWebVital_shopId_sessionId_route_metric_key" ON "AdminWebVital"("shopId", "sessionId", "route", "metric");

-- CreateIndex
CREATE INDEX "AdminWebVital_shopId_idx" ON "AdminWebVital"("shopId");

-- CreateIndex
CREATE INDEX "AdminWebVital_route_idx" ON "AdminWebVital"("route");

-- CreateIndex
CREATE INDEX "AdminWebVital_metric_idx" ON "AdminWebVital"("metric");

-- CreateIndex
CREATE INDEX "AdminWebVital_shopId_createdAt_idx" ON "AdminWebVital"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminWebVital_route_metric_createdAt_idx" ON "AdminWebVital"("route", "metric", "createdAt");
