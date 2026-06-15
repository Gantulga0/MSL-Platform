-- Handedness option entity (one/two hands) with an image.
CREATE TABLE "handedness" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "image_url" TEXT,
    "hand_count" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "handedness_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "handedness_code_key" ON "handedness"("code");
