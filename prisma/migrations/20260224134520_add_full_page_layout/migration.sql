-- CreateEnum
CREATE TYPE "public"."FullPageLayout" AS ENUM ('footer_bottom', 'footer_side');

-- AlterTable
ALTER TABLE "public"."Bundle" ADD COLUMN     "fullPageLayout" "public"."FullPageLayout" DEFAULT 'footer_bottom';
