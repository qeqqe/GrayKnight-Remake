-- AlterTable
ALTER TABLE "UserTrack" ADD COLUMN     "artistIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "context_type" TEXT,
ADD COLUMN     "context_uri" TEXT,
ADD COLUMN     "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "popularity" INTEGER;

-- CreateTable
CREATE TABLE "TrackPlay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trackName" TEXT NOT NULL,
    "artistIds" TEXT[],
    "artistNames" TEXT[],
    "albumName" TEXT NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "popularity" INTEGER,
    "context_type" TEXT,
    "context_uri" TEXT,
    "played_duration_ms" INTEGER,
    "skipped" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TrackPlay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistGenreCache" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "genres" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistGenreCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackPlay_userId_timestamp_idx" ON "TrackPlay"("userId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "TrackPlay_timestamp_idx" ON "TrackPlay"("timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ArtistGenreCache_artistId_key" ON "ArtistGenreCache"("artistId");

-- CreateIndex
CREATE INDEX "ArtistGenreCache_artistId_idx" ON "ArtistGenreCache"("artistId");

-- CreateIndex
CREATE INDEX "UserTrack_userId_playedAt_idx" ON "UserTrack"("userId", "playedAt" DESC);

-- AddForeignKey
ALTER TABLE "TrackPlay" ADD CONSTRAINT "TrackPlay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
