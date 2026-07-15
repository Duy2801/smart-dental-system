-- AlterTable
ALTER TABLE "services"
ADD COLUMN "slug" TEXT,
ADD COLUMN "short_description" TEXT,
ADD COLUMN "thumbnail_url" TEXT,
ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "display_order" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "service_media" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "type" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_procedure_steps" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "step_order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration_minutes" INTEGER,

    CONSTRAINT "service_procedure_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_faqs" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "service_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE INDEX "services_is_featured_display_order_idx" ON "services"("is_featured", "display_order");

-- CreateIndex
CREATE INDEX "service_media_service_id_sort_order_idx" ON "service_media"("service_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "service_procedure_steps_service_id_step_order_key" ON "service_procedure_steps"("service_id", "step_order");

-- CreateIndex
CREATE INDEX "service_procedure_steps_service_id_idx" ON "service_procedure_steps"("service_id");

-- CreateIndex
CREATE INDEX "service_faqs_service_id_sort_order_idx" ON "service_faqs"("service_id", "sort_order");

-- AddForeignKey
ALTER TABLE "service_media" ADD CONSTRAINT "service_media_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_procedure_steps" ADD CONSTRAINT "service_procedure_steps_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_faqs" ADD CONSTRAINT "service_faqs_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
