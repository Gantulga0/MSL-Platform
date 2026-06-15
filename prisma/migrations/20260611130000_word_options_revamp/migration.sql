-- Option imagery (А1): handshape / position / movement now carry an image.
ALTER TABLE "handshapes" ADD COLUMN "image_url" TEXT;
ALTER TABLE "sign_locations" ADD COLUMN "image_url" TEXT;
ALTER TABLE "sign_movements" ADD COLUMN "image_url" TEXT;

-- Word model changes (А2 / Б): definition optional, view count removed.
ALTER TABLE "words" ALTER COLUMN "definition" DROP NOT NULL;
DROP INDEX IF EXISTS "words_view_count_idx";
ALTER TABLE "words" DROP COLUMN "view_count";

-- Handshape becomes many-to-many (В): introduce the join table first.
CREATE TABLE "word_handshapes" (
    "word_id" TEXT NOT NULL,
    "handshape_id" TEXT NOT NULL,

    CONSTRAINT "word_handshapes_pkey" PRIMARY KEY ("word_id", "handshape_id")
);

CREATE INDEX "word_handshapes_handshape_id_idx" ON "word_handshapes"("handshape_id");

ALTER TABLE "word_handshapes" ADD CONSTRAINT "word_handshapes_word_id_fkey"
    FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "word_handshapes" ADD CONSTRAINT "word_handshapes_handshape_id_fkey"
    FOREIGN KEY ("handshape_id") REFERENCES "handshapes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Carry any existing single-handshape selections into the join table.
INSERT INTO "word_handshapes" ("word_id", "handshape_id")
SELECT "id", "handshape_id" FROM "words" WHERE "handshape_id" IS NOT NULL;

-- Drop the old single FK column + its index.
DROP INDEX IF EXISTS "words_handshape_id_idx";
ALTER TABLE "words" DROP CONSTRAINT IF EXISTS "words_handshape_id_fkey";
ALTER TABLE "words" DROP COLUMN "handshape_id";
