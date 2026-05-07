import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, phone: true, studentId: true, role: true }
  });
  console.log("Users in DB:\n", JSON.stringify(users, null, 2));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
