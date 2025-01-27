-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "profileUrl" TEXT,
    "country" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "offlineTrackingEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTrack" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackSpotifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL,
    "playCount" INTEGER NOT NULL DEFAULT 1,
    "totalListenTime" INTEGER NOT NULL DEFAULT 0,
    "skipCount" INTEGER NOT NULL DEFAULT 0,
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "artistIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "popularity" INTEGER,
    "context_type" TEXT,
    "context_uri" TEXT,

    CONSTRAINT "UserTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPlaylist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalTracks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPlaylist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserArtist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalPlayTime" INTEGER NOT NULL DEFAULT 0,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "firstListen" TIMESTAMP(3),
    "lastListen" TIMESTAMP(3),
    "genres" TEXT[],

    CONSTRAINT "UserArtist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGenre" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalPlayTime" INTEGER NOT NULL DEFAULT 0,
    "playCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserGenre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListeningSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER NOT NULL,
    "device" TEXT,
    "availableDevices" TEXT[],
    "context" TEXT,

    CONSTRAINT "ListeningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionTrack" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "trackSpotifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,

    CONSTRAINT "SessionTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistTrack" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "trackSpotifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaylistTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "totalListenTime" INTEGER NOT NULL,
    "uniqueTrackCount" INTEGER NOT NULL,
    "uniqueArtistCount" INTEGER NOT NULL,
    "topGenres" JSONB NOT NULL,
    "topArtists" JSONB NOT NULL,
    "topTracks" JSONB NOT NULL,
    "averageTrackEnergy" DOUBLE PRECISION,
    "averageTrackValence" DOUBLE PRECISION,

    CONSTRAINT "UserInsight_pkey" PRIMARY KEY ("id")
);

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
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "genres" TEXT[],
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistGenreCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_spotifyId_key" ON "User"("spotifyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "UserTrack_userId_playedAt_idx" ON "UserTrack"("userId", "playedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "UserTrack_userId_trackSpotifyId_playedAt_key" ON "UserTrack"("userId", "trackSpotifyId", "playedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPlaylist_spotifyId_key" ON "UserPlaylist"("spotifyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserArtist_userId_spotifyId_key" ON "UserArtist"("userId", "spotifyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGenre_userId_name_key" ON "UserGenre"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UserInsight_userId_period_periodStart_key" ON "UserInsight"("userId", "period", "periodStart");

-- CreateIndex
CREATE INDEX "TrackPlay_userId_timestamp_idx" ON "TrackPlay"("userId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "TrackPlay_timestamp_idx" ON "TrackPlay"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "ArtistGenreCache_artistId_idx" ON "ArtistGenreCache"("artistId");

-- CreateIndex
CREATE INDEX "ArtistGenreCache_userId_idx" ON "ArtistGenreCache"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistGenreCache_artistId_userId_key" ON "ArtistGenreCache"("artistId", "userId");

-- AddForeignKey
ALTER TABLE "UserTrack" ADD CONSTRAINT "UserTrack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPlaylist" ADD CONSTRAINT "UserPlaylist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserArtist" ADD CONSTRAINT "UserArtist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGenre" ADD CONSTRAINT "UserGenre_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListeningSession" ADD CONSTRAINT "ListeningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTrack" ADD CONSTRAINT "SessionTrack_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ListeningSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "UserPlaylist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInsight" ADD CONSTRAINT "UserInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackPlay" ADD CONSTRAINT "TrackPlay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistGenreCache" ADD CONSTRAINT "ArtistGenreCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
