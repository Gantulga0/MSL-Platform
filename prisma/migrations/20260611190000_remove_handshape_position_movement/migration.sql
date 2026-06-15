-- Remove the handshape / position (location) / movement option model entirely.

-- Word ↔ handshape join table.
DROP TABLE IF EXISTS "word_handshapes";

-- Word position/movement columns.
ALTER TABLE "words" DROP CONSTRAINT IF EXISTS "words_location_id_fkey";
ALTER TABLE "words" DROP CONSTRAINT IF EXISTS "words_movement_id_fkey";
DROP INDEX IF EXISTS "words_location_id_idx";
DROP INDEX IF EXISTS "words_movement_id_idx";
ALTER TABLE "words" DROP COLUMN IF EXISTS "location_id";
ALTER TABLE "words" DROP COLUMN IF EXISTS "movement_id";

-- Submission position column.
ALTER TABLE "submissions" DROP CONSTRAINT IF EXISTS "submissions_location_id_fkey";
DROP INDEX IF EXISTS "submissions_location_id_idx";
ALTER TABLE "submissions" DROP COLUMN IF EXISTS "location_id";

-- Option tables.
DROP TABLE IF EXISTS "handshapes";
DROP TABLE IF EXISTS "sign_locations";
DROP TABLE IF EXISTS "sign_movements";
