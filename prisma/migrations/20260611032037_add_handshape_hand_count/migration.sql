-- AlterTable
ALTER TABLE "words" ADD COLUMN     "hand_count" INTEGER,
ADD COLUMN     "handshape_id" TEXT;

-- CreateTable
CREATE TABLE "handshapes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "handshapes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "handshapes_code_key" ON "handshapes"("code");

-- CreateIndex
CREATE INDEX "words_handshape_id_idx" ON "words"("handshape_id");

-- CreateIndex
CREATE INDEX "words_hand_count_idx" ON "words"("hand_count");

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "words_handshape_id_fkey" FOREIGN KEY ("handshape_id") REFERENCES "handshapes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
