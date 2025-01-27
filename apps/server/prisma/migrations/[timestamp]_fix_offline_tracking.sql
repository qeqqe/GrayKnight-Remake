-- First clean up any potential issues
DELETE FROM "ArtistGenreCache" WHERE "userId" IS NULL;

-- Add offlineTrackingEnabled to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "offlineTrackingEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Add onDelete CASCADE to ArtistGenreCache
ALTER TABLE "ArtistGenreCache" DROP CONSTRAINT IF EXISTS "ArtistGenreCache_userId_fkey";
ALTER TABLE "ArtistGenreCache" ADD CONSTRAINT "ArtistGenreCache_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
