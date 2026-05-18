const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('admin123', 10);
console.log('Hash:', hash);

// Use Prisma to update the password
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({
    where: { email: 'admin@athenglish.com' },
    data: { password: hash }
  });
  console.log('Password updated successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
