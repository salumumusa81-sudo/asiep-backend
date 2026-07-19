require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: [] });

const UNIVERSITIES = [
  { name:'University of Dar es Salaam', shortName:'UDSM', country:'Tanzania', city:'Dar es Salaam', website:'https://udsm.ac.tz' },
  { name:'Ardhi University', shortName:'ARU', country:'Tanzania', city:'Dar es Salaam', website:'https://aru.ac.tz' },
  { name:'Muhimbili University', shortName:'MUHAS', country:'Tanzania', city:'Dar es Salaam', website:'https://muhas.ac.tz' },
  { name:'Sokoine University of Agriculture', shortName:'SUA', country:'Tanzania', city:'Morogoro', website:'https://sua.ac.tz' },
  { name:'University of Nairobi', shortName:'UoN', country:'Kenya', city:'Nairobi', website:'https://uonbi.ac.ke' },
  { name:'Makerere University', shortName:'MAK', country:'Uganda', city:'Kampala', website:'https://mak.ac.ug' },
  { name:'KNUST Kumasi', shortName:'KNUST', country:'Ghana', city:'Kumasi', website:'https://knust.edu.gh' },
  { name:'University of Ghana', shortName:'UG', country:'Ghana', city:'Accra', website:'https://ug.edu.gh' },
];

async function main() {
  console.log('🏫 Kuweka universities...');
  for (const u of UNIVERSITIES) {
    await prisma.university.upsert({
      where: { name: u.name },
      update: {},
      create: { ...u, isVerified: true },
    });
    console.log(`  ✅ ${u.name}`);
  }
  console.log('\n✅ Universities zote zimewekwa!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
