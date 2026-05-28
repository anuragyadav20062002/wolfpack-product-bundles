ALTER TABLE "public"."Session"
ADD COLUMN "refreshToken" TEXT,
ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP(3);
