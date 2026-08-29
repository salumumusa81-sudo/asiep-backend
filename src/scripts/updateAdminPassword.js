const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const newPassword = 'Kuntankinte2025!';
  const hashed = await bcrypt.hash(newPassword, 10);
  
  const user = await prisma.user.update({
    where: { email: 'admin@asiep.africa' },
    data: { password: hashed },
  });
  console.log('✅ Password updated for:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());