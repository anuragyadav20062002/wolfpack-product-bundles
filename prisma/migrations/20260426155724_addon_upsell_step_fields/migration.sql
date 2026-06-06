-- AlterTable
ALTER TABLE "BundleStep" ADD COLUMN     "addonDisplayFree" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "addonIconUrl" TEXT,
ADD COLUMN     "addonLabel" TEXT,
ADD COLUMN     "addonTitle" TEXT,
ADD COLUMN     "addonUnlockAfterCompletion" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "DesignSettings" ALTER COLUMN "freeGiftBadgePosition" DROP NOT NULL,
ALTER COLUMN "includedBadgeUrl" DROP NOT NULL,
ALTER COLUMN "includedBadgePosition" DROP NOT NULL;
