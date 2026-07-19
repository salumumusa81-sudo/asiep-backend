require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log:[] });

const STARTUPS = [
  {
    name:'SwahiliSense', tagline:'AI sentiment analysis kwa biashara za Afrika',
    description:'Tunasaidia makampuni ya Afrika kuelewa wateja wao kupitia AI inayoelewa Kiswahili, Hausa, na Amharic. Tayari tuna wateja 3 wa enterprise.',
    stage:'BETA', sector:'AI / ML', country:'Tanzania',
    website:'https://swahilisense.ai', demoUrl:'https://demo.swahilisense.ai',
    fundingGoal:150000, fundingRaised:35000, equity:15,
    milestones:[
      { title:'Unda MVP', status:'COMPLETED', completedAt: new Date('2024-06-01') },
      { title:'Pata watumiaji 100', status:'COMPLETED', completedAt: new Date('2024-09-01') },
      { title:'Thibitisha mapato ya kwanza', status:'COMPLETED', completedAt: new Date('2024-11-01') },
      { title:'Omba seed funding $150k', status:'IN_PROGRESS' },
      { title:'Pata wawekezaji wa Series A', status:'PENDING' },
    ],
  },
  {
    name:'MajiSmart', tagline:'IoT irrigation kwa wakulima wadogo Afrika Mashariki',
    description:'Mfumo wa umwagiliaji wa akili unaotumia sensors za bei nafuu na SMS alerts. Tumepunguza matumizi ya maji kwa 43% kwenye mashamba 15. MRR: $2,400.',
    stage:'LAUNCHED', sector:'AgriTech', country:'Tanzania',
    website:'https://majismart.co.tz',
    fundingGoal:80000, fundingRaised:12000, equity:20,
    milestones:[
      { title:'Unda MVP', status:'COMPLETED', completedAt: new Date('2024-03-01') },
      { title:'Pata watumiaji 100', status:'COMPLETED', completedAt: new Date('2024-07-01') },
      { title:'Thibitisha mapato', status:'COMPLETED', completedAt: new Date('2024-10-01') },
      { title:'Omba grant ya Safaricom', status:'IN_PROGRESS' },
      { title:'Panua Kenya na Uganda', status:'PENDING' },
    ],
  },
  {
    name:'AfyaConnect', tagline:'Telemedicine kwa jamii za vijijini Afrika',
    description:'Tunawezesha wagonjwa wa vijijini kuonana na daktari kupitia USSD na video ya bandwidth ndogo. Tayari tuna wagonjwa 1,200 na hospitali 4 washirika.',
    stage:'SCALING', sector:'Health', country:'Kenya',
    website:'https://afyaconnect.health',
    fundingGoal:250000, fundingRaised:75000, equity:12,
    milestones:[
      { title:'Unda MVP', status:'COMPLETED', completedAt: new Date('2023-12-01') },
      { title:'Pata watumiaji 100', status:'COMPLETED', completedAt: new Date('2024-04-01') },
      { title:'Thibitisha mapato', status:'COMPLETED', completedAt: new Date('2024-08-01') },
      { title:'Seed funding $250k', status:'IN_PROGRESS' },
      { title:'Panua nchi 5 za Afrika', status:'PENDING' },
    ],
  },
  {
    name:'SACCO Chain', tagline:'Blockchain kwa vikundi vya akiba vijijini',
    description:'Tunasaidia vikundi vya SACCO/VSLA kusimamia fedha kwa uwazi kupitia blockchain. Vikundi 45 wanaotumia, jumla ya fedha $120,000 zinazosimamishwa.',
    stage:'LAUNCHED', sector:'Fintech', country:'Senegal',
    fundingGoal:100000, fundingRaised:0, equity:18,
    milestones:[
      { title:'Unda MVP', status:'COMPLETED', completedAt: new Date('2024-05-01') },
      { title:'Pata vikundi 10', status:'COMPLETED', completedAt: new Date('2024-08-01') },
      { title:'Thibitisha usalama', status:'IN_PROGRESS' },
      { title:'Omba ufadhili', status:'PENDING' },
      { title:'Panua Afrika Magharibi', status:'PENDING' },
    ],
  },
  {
    name:'AgroPredict', tagline:'AI inayotabiri magonjwa ya mazao Afrika',
    description:'Mfumo wa AI unaotumia picha za simu kutambua magonjwa 28 ya mazao. Wakulima 3,400 wanaotumia kupitia WhatsApp bot. Usahihi wa 91%.',
    stage:'BETA', sector:'AgriTech', country:'Ghana',
    demoUrl:'https://wa.me/233XXXXXXX',
    fundingGoal:120000, fundingRaised:20000, equity:15,
    milestones:[
      { title:'Unda MVP', status:'COMPLETED', completedAt: new Date('2024-02-01') },
      { title:'Pata watumiaji 1000', status:'COMPLETED', completedAt: new Date('2024-07-01') },
      { title:'Partnership na NGO', status:'IN_PROGRESS' },
      { title:'Seed funding', status:'PENDING' },
      { title:'Panua Nigeria na Côte d\'Ivoire', status:'PENDING' },
    ],
  },
];

async function main() {
  const users = await prisma.user.findMany({ take:5, where:{ role:'STUDENT' } });
  if (users.length === 0) { console.log('❌ Kwanza run seedSampleData.js'); return; }

  console.log('🚀 Kuweka startups...');
  for (let i=0; i<STARTUPS.length; i++) {
    const s = STARTUPS[i];
    const founder = users[i % users.length];
    const { milestones, ...data } = s;

    const existing = await prisma.startup.findFirst({ where:{ name:s.name } });
    if (existing) { console.log(`  ⏭ ${s.name} ipo tayari`); continue; }

    const startup = await prisma.startup.create({
      data: {
        ...data, founderId: founder.id,
        milestones: { create: milestones },
      },
    });
    console.log(`  ✅ ${s.name} (${s.stage}) — Founded by ${founder.name}`);
  }
  console.log('\n✅ Startups zote zimewekwa!');
  console.log(`💰 Jumla ya funding goals: $${STARTUPS.reduce((s,st)=>s+st.fundingGoal,0).toLocaleString()}`);
}

main().catch(console.error).finally(()=>prisma.$disconnect());
