-- DropForeignKey
ALTER TABLE "ArtistGenreCache" DROP CONSTRAINT "ArtistGenreCache_userId_fkey";

-- AddForeignKey
ALTER TABLE "ArtistGenreCache" ADD CONSTRAINT "ArtistGenreCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
