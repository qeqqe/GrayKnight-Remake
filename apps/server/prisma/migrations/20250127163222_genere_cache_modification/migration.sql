-- AlterTable
ALTER TABLE "ArtistGenreCache" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "ArtistGenreCache_userId_idx" ON "ArtistGenreCache"("userId");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- AddForeignKey
ALTER TABLE "ArtistGenreCache" ADD CONSTRAINT "ArtistGenreCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
