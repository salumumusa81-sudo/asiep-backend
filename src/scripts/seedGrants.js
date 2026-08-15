require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('💰 Kuweka grants za sponsors...');

  const GRANTS = [
    {
      title: 'Safaricom Innovation Grant 2025',
      description: 'Tunasaidia wanafunzi wanaofanya kazi kwenye suluhisho za AgriTech na AI kwa wakulima wadogo Afrika Mashariki.',
      amount: 8000,
     
      category: 'AgriTech',
      deadline: new Date('2026-09-15'),
      requirements: 'Mwanafunzi wa chuo kikuu Afrika Mashariki. Mradi wa AgriTech au AI. Demo inayofanya kazi.',
      maxApplicants: 100,
      sponsorName: 'Safaricom PLC',
      status: 'OPEN',
    },
    {
      title: 'Microsoft Africa Research Grant',
      description: 'Mfuko wa utafiti kwa wanafunzi wanaofanya kazi kwenye AI, ML, na Cloud computing.',
      amount: 15000,
      
      category: 'AI / ML',
      deadline: new Date('2026-10-01'),
      requirements: 'Mwanafunzi wa uzamili au uzamivu. Mradi wa AI/ML na kazi ya utafiti.',
      maxApplicants: 30,
      sponsorName: 'Microsoft Africa',
      status: 'OPEN',
    },
    {
      title: 'Equity Bank HealthTech Fund',
      description: 'Tunasaidia wabuni wa teknolojia ya afya wanaotaka kuleta mabadiliko kwa jamii za vijijini Afrika.',
      amount: 5000,
     
      category: 'Health',
      deadline: new Date('2026-09-30'),
      requirements: 'Wanafunzi wa Afrika. Mradi wa HealthTech wenye demo. Ushirikiano na hospitali.',
      maxApplicants: 50,
      sponsorName: 'Equity Bank',
      status: 'OPEN',
    },
    {
      title: 'UNDP Youth Innovation Award',
      description: 'Tunatoa tuzo kwa vijana wa Afrika wanaoshughulikia Malengo ya Maendeleo Endelevu.',
      amount: 10000,
      
      category: 'Sustainability',
      deadline: new Date('2026-11-15'),
      requirements: 'Umri 18-35. Mradi unaoshughulikia SDG. Athari inayopimika kwa jamii.',
      maxApplicants: 200,
      sponsorName: 'UNDP Africa',
      status: 'OPEN',
    },
    {
      title: 'Google.org Africa Fintech Grant',
      description: 'Mfuko wa kuendeleza fintech suluhisho kwa jamii zisizo na huduma za benki Afrika.',
      amount: 20000,
      
      category: 'Fintech',
      deadline: new Date('2026-08-30'),
      requirements: 'Startup au mradi wa chuo. Suluhisho la fintech lenye ushahidi. Timu yenye ujuzi.',
      maxApplicants: 25,
      sponsorName: 'Google.org',
      status: 'OPEN',
    },
    {
      title: 'AfDB EdTech Innovation Prize',
      description: 'Benki ya Maendeleo ya Afrika inatoa tuzo kwa miradi ya elimu inayotumia teknolojia.',
      amount: 12000,
      
      category: 'Education',
      deadline: new Date('2026-12-01'),
      requirements: 'Mradi wa EdTech wenye athari. Ushirikiano na shule. Uhalisi wa kupanuka.',
      maxApplicants: 60,
      sponsorName: 'African Development Bank',
      status: 'OPEN',
    },
  ];

  for (const grant of GRANTS) {
    try {
      await p.sponsorGrant.create({ data: grant });
      console.log(`✅ ${grant.title}`);
    } catch(err) {
      console.log(`⚠️ ${grant.title}: ${err.message.slice(0,50)}`);
    }
  }

  console.log('✅ Grants zote zimewekwa!');
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());