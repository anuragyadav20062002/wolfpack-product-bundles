ALTER TABLE "Bundle"
  DROP COLUMN IF EXISTS "giftMessagesEnabled",
  DROP COLUMN IF EXISTS "giftMessageProductId",
  DROP COLUMN IF EXISTS "giftMessageProductTitle",
  DROP COLUMN IF EXISTS "giftMessageEnableSenderRecipient",
  DROP COLUMN IF EXISTS "giftMessageMandatory",
  DROP COLUMN IF EXISTS "giftMessageEnableLimit",
  DROP COLUMN IF EXISTS "giftMessageCharLimit",
  DROP COLUMN IF EXISTS "giftMessageSendEmail";
