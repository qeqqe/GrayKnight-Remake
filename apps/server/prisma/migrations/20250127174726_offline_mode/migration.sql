/*
  Warnings:

  - A unique constraint covering the columns `[artistId,userId]` on the table `ArtistGenreCache` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userId` on table `ArtistGenreCache` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ArtistGenreCache" DROP CONSTRAINT "ArtistGenreCache_userId_fkey";

-- DropIndex
DROP INDEX "ArtistGenreCache_artistId_key";

-- AlterTable
ALTER TABLE "ArtistGenreCache" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "offlineTrackingEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "ArtistGenreCache_artistId_userId_key" ON "ArtistGenreCache"("artistId", "userId");

-- AddForeignKey
ALTER TABLE "ArtistGenreCache" ADD CONSTRAINT "ArtistGenreCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
