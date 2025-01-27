/* eslint-disable prettier/prettier */
import { PrismaClient } from '@prisma/client';

async function cleanup() {
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRaw`DELETE FROM "_prisma_migrations" WHERE migration_name = '20250127174726_offline_mode';`;

    await prisma.$executeRaw`DELETE FROM "ArtistGenreCache" WHERE "userId" IS NULL;`;

    console.log('Successfully cleaned up migration state');
  } catch (error) {
    console.error('Error cleaning up:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
