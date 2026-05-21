-- AlterEnum
ALTER TYPE "DiscountMethodType" ADD VALUE 'buy_x_get_y';

-- AlterTable
ALTER TABLE "Bundle" ADD COLUMN     "autoSelectBrowsedProduct" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bundleBannerDesktopUrl" TEXT,
ADD COLUMN     "bundleBannerMobileUrl" TEXT,
ADD COLUMN     "bundleCartSubtitle" TEXT,
ADD COLUMN     "bundleCartTitle" TEXT,
ADD COLUMN     "bundleLevelCss" TEXT,
ADD COLUMN     "giftMessageCharLimit" INTEGER,
ADD COLUMN     "giftMessageEnableLimit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "giftMessageEnableSenderRecipient" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "giftMessageMandatory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "giftMessageProductId" TEXT,
ADD COLUMN     "giftMessageProductTitle" TEXT,
ADD COLUMN     "giftMessageSendEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "giftMessagesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxQtyPerProduct" INTEGER,
ADD COLUMN     "preSelectedProductVariantId" TEXT,
ADD COLUMN     "productSlotIconUrl" TEXT,
ADD COLUMN     "productSlotsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showTextOnAddButton" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "upsellWidgetDisplayMode" TEXT,
ADD COLUMN     "upsellWidgetDisplayOn" TEXT,
ADD COLUMN     "upsellWidgetEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "variantSelectorEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "BundlePricing" ADD COLUMN     "displayOptions" JSONB;
