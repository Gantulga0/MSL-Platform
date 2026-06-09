-- Simplify Role enum to user/admin and remove school + word versioning.

ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('user', 'admin');

ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "Role"
  USING (
    CASE "role"::text
      WHEN 'admin' THEN 'admin'::"Role"
      ELSE 'user'::"Role"
    END
  );

DROP TYPE "Role_old";

-- Drop school-scoped tables and columns.
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_school_id_fkey";
ALTER TABLE "words" DROP CONSTRAINT IF EXISTS "words_school_id_fkey";
ALTER TABLE "submissions" DROP CONSTRAINT IF EXISTS "submissions_school_id_fkey";

DROP TABLE IF EXISTS "class_codes";
DROP TABLE IF EXISTS "word_versions";

ALTER TABLE "users" DROP COLUMN IF EXISTS "school_id";
ALTER TABLE "words" DROP COLUMN IF EXISTS "school_id";
ALTER TABLE "words" DROP COLUMN IF EXISTS "current_version";
ALTER TABLE "submissions" DROP COLUMN IF EXISTS "school_id";

DROP TABLE IF EXISTS "schools";

DROP INDEX IF EXISTS "users_school_id_idx";
