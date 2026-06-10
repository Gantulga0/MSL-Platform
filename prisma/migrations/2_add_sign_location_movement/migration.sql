-- Add sign-phonology taxonomies (location, movement) and link them to words.

CREATE TABLE "sign_locations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "sign_locations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sign_movements" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "sign_movements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sign_locations_code_key" ON "sign_locations"("code");
CREATE UNIQUE INDEX "sign_movements_code_key" ON "sign_movements"("code");

ALTER TABLE "words" ADD COLUMN "location_id" TEXT;
ALTER TABLE "words" ADD COLUMN "movement_id" TEXT;

CREATE INDEX "words_location_id_idx" ON "words"("location_id");
CREATE INDEX "words_movement_id_idx" ON "words"("movement_id");

ALTER TABLE "words" ADD CONSTRAINT "words_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "sign_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "words" ADD CONSTRAINT "words_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "sign_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
