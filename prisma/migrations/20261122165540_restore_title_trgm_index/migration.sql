-- CreateIndex
CREATE INDEX "courses_title_trgm_idx" ON "courses" USING GIN ("title" gin_trgm_ops);
