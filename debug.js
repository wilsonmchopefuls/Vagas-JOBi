const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const pending = await prisma.jobPost.count({ where: { status: 'PENDING' } });
  console.log('PENDING JOBS:', pending);
  const notifs = await prisma.notification.findMany();
  console.log('NOTIFICATIONS:', notifs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
