-- Add an `example_video` media type so a word can carry, alongside its main
-- sign video, a second video that signs the example sentence.
ALTER TYPE "MediaType" ADD VALUE IF NOT EXISTS 'example_video';
