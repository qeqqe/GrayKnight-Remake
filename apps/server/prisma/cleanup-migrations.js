/* eslint-disable prettier/prettier */
import { PrismaClient } from '@prisma/client';

async function cleanup() {
  const prisma = new PrismaClient();
  try {
    // Only clear the failed migration state
    await prisma.$executeRaw`DELETE FROM "_prisma_migrations" WHERE migration_name = '20250127174726_offline_mode' AND success = false;`;

    // Don't delete data, just update null values if any exist
    await prisma.$executeRaw`
      UPDATE "ArtistGenreCache" 
      SET "userId" = (SELECT id FROM "User" LIMIT 1) 
      WHERE "userId" IS NULL;
    `;

    console.log(
      'Successfully cleaned up migration state while preserving data',
    );
  } catch (error) {
    console.error('Error cleaning up:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
