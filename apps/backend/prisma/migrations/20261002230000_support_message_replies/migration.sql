ALTER TABLE "support_messages"
ADD COLUMN "reply_to_id" UUID,
ADD COLUMN "reply_preview" TEXT,
ADD COLUMN "reply_sender_type" "SupportMessageSender";
