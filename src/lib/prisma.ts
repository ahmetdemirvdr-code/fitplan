import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient();
}

/** Recreate if hot-reload left a stale client without newer models (e.g. stepLog). */
function getPrisma() {
  const existing = globalForPrisma.prisma;
  if (existing && typeof (existing as { stepLog?: unknown }).stepLog?.findMany === "function") {
    return existing;
  }
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrisma();
