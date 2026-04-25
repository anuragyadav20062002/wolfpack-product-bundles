-- Migration: add per-bundle text override JSON columns
ALTER TABLE "Bundle" ADD COLUMN "textOverrides" JSONB;
ALTER TABLE "Bundle" ADD COLUMN "textOverridesByLocale" JSONB;
