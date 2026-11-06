// Usage: npm run make-admin -- someone@example.com
import { PrismaClient } from "@prisma/client";
const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run make-admin -- <email>");
  process.exit(1);
}
const prisma = new PrismaClient();
const user = await prisma.user.update({ where: { email: email.toLowerCase() }, data: { role: "ADMIN" } });
console.log(`${user.email} is now an admin`);
await prisma.$disconnect();
