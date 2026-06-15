-- Add hand count to submissions so the public submit form can capture
-- one- vs two-handed signs (FR-02). Nullable for backward compatibility with
-- rows created before the field existed.
ALTER TABLE "submissions" ADD COLUMN "hand_count" INTEGER;
