ALTER TABLE "Shop"
ADD COLUMN "customUtmParameters" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "OrderAttribution"
ADD COLUMN "customUtmAttributes" JSONB NOT NULL DEFAULT '{}';
