-- Submissions now capture the sign position chosen by the submitter.
ALTER TABLE "submissions" ADD COLUMN "location_id" TEXT;

CREATE INDEX "submissions_location_id_idx" ON "submissions"("location_id");

ALTER TABLE "submissions" ADD CONSTRAINT "submissions_location_id_fkey"
    FOREIGN KEY ("location_id") REFERENCES "sign_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
