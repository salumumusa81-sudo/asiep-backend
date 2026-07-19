require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('🏆 Kuweka challenges...');

  await p.challenge.createMany({
    data: [
      { title:'AgriAI Challenge', description:'Build AI solutions for sustainable agriculture across East Africa.', prize:8000, company:'Safaricom', deadline:new Date('2026-12-01'), isActive:true },
      { title:'HealthTech Africa', description:'Create innovative health solutions for underserved communities.', prize:5000, company:'Equity Bank', deadline:new Date('2026-11-15'), isActive:true },
      { title:'Cloud Innovation', description:'Leverage cloud to build scalable solutions for African challenges.', prize:12000, company:'Microsoft Africa', deadline:new Date('2026-10-30'), isActive:true },
      { title:'Sustainability Goals', description:'Solutions aligned with UN Sustainable Development Goals.', prize:3500, company:'UNDP Tanzania', deadline:new Date('2026-09-30'), isActive:true },
      { title:'EdTech Innovation', description:'Transform education using technology for African students.', prize:6000, company:'Twiga Foods', deadline:new Date('2027-01-15'), isActive:true },
      { title:'GreenTech Challenge', description:'Renewable energy solutions for rural electrification.', prize:4500, company:'GreenPower Africa', deadline:new Date('2026-11-30'), isActive:true },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Challenges 6 zimewekwa!');
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());