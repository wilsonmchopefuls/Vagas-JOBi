/**
 * lib/prisma.js — Singleton do PrismaClient para Next.js.
 *
 * Em produção: uma única instância por processo (serverless function).
 * Em dev: singleton via globalThis para sobreviver ao HMR sem vazar conexões.
 *
 * Ref: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// Em produção, instanciar uma vez e reutilizar durante o ciclo do processo.
// Em dev, globalThis sobrevive ao HMR evitando múltiplas instâncias.
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { prisma };
export default prisma;
