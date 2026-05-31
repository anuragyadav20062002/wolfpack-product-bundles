-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "appEmbedCheckedAt" TIMESTAMP(3),
ADD COLUMN     "appEmbedEnabled" BOOLEAN,
ADD COLUMN     "appEmbedThemeId" TEXT;
