require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient({ log: [] });

const USERS = [
  { name:'Amara Kamau',       username:'amara.kamau',     email:'amara@demo.asiep.africa',      password:'demo1234',    role:'STUDENT',  university:'University of Dar es Salaam', country:'Tanzania' },
  { name:'Fatuma Ngozi',      username:'fatuma.ngozi',    email:'fatuma@demo.asiep.africa',     password:'demo1234',    role:'STUDENT',  university:'University of Nairobi',       country:'Kenya' },
  { name:'Kwame Mensah',      username:'kwame.mensah',    email:'kwame@demo.asiep.africa',      password:'demo1234',    role:'STUDENT',  university:'KNUST Kumasi',                country:'Ghana' },
  { name:'Aisha Diallo',      username:'aisha.diallo',    email:'aisha@demo.asiep.africa',      password:'demo1234',    role:'STUDENT',  university:'Universite Cheikh Anta Diop', country:'Senegal' },
  { name:'Grace Okonkwo',     username:'grace.okonkwo',   email:'grace@demo.asiep.africa',      password:'demo1234',    role:'STUDENT',  university:'University of Lagos',         country:'Nigeria' },
  { name:'Brian Oduya',       username:'brian.oduya',     email:'brian@demo.asiep.africa',      password:'demo1234',    role:'STUDENT',  university:'Makerere University',         country:'Uganda' },
  { name:'Neema Hassan',      username:'neema.hassan',    email:'neema@demo.asiep.africa',      password:'demo1234',    role:'STUDENT',  university:'Ardhi University',            country:'Tanzania' },
  { name:'Chidi Okafor',      username:'chidi.okafor',    email:'chidi@demo.asiep.africa',      password:'demo1234',    role:'STUDENT',  university:'University of Ghana',         country:'Ghana' },
  { name:'Wanjiru Mwangi',    username:'wanjiru.m',       email:'wanjiru@demo.asiep.africa',    password:'demo1234',    role:'STUDENT',  university:'Strathmore University',       country:'Kenya' },
  { name:'Seun Adeyemi',      username:'seun.adeyemi',    email:'seun@demo.asiep.africa',       password:'demo1234',    role:'STUDENT',  university:'Obafemi Awolowo University',  country:'Nigeria' },
  { name:'Dr. Kofi Mensah',   username:'dr.kofi',         email:'kofi@demo.asiep.africa',       password:'demo1234',    role:'MENTOR',   university:'University of Ghana',         country:'Ghana' },
  { name:'Sarah Akeju',       username:'sarah.akeju',     email:'sarah@demo.asiep.africa',      password:'demo1234',    role:'MENTOR',   university:'Flutterwave',                 country:'Nigeria' },
  { name:'Emmanuel Waweru',   username:'emmanuel.w',      email:'emmanuel@demo.asiep.africa',   password:'demo1234',    role:'MENTOR',   university:'Twiga Foods',                 country:'Kenya' },
  { name:'Dr. Amina Njoroge', username:'dr.amina',        email:'amina@demo.asiep.africa',      password:'demo1234',    role:'MENTOR',   university:'WHO Africa',                  country:'Kenya' },
  { name:'Laila Diallo',      username:'laila.diallo',    email:'laila@demo.asiep.africa',      password:'demo1234',    role:'MENTOR',   university:'MTN Group',                   country:'South Africa' },
  { name:'Bashir Okonkwo',    username:'bashir.vc',       email:'bashir@demo.asiep.africa',     password:'demo1234',    role:'INVESTOR', university:'Partech Africa',              country:'Senegal' },
  { name:'Zainab Traore',     username:'zainab.invest',   email:'zainab@demo.asiep.africa',     password:'demo1234',    role:'INVESTOR', university:'TLcom Capital',               country:'Kenya' },
  { name:'Marcus Asante',     username:'marcus.angel',    email:'marcus@demo.asiep.africa',     password:'demo1234',    role:'INVESTOR', university:'Angels Africa Network',       country:'Ghana' },
  { name:'Safaricom Innovation', username:'safaricom.hub',email:'innovation@safaricom.demo',    password:'demo1234',    role:'COMPANY',  university:'Safaricom PLC',               country:'Kenya' },
  { name:'Microsoft Africa',  username:'microsoft.africa',email:'africa@microsoft.demo',        password:'demo1234',    role:'COMPANY',  university:'Microsoft Africa',            country:'South Africa' },
  { name:'Equity Bank Tech',  username:'equity.tech',     email:'tech@equitybank.demo',         password:'demo1234',    role:'COMPANY',  university:'Equity Bank Group',           country:'Kenya' },
  { name:'ASIEP Admin',       username:'asiep.admin',     email:'admin@asiep.africa',           password:'Admin2025!',  role:'ADMIN',    university:'ASIEP HQ',                    country:'Tanzania' },
  { name:'ASIEP Support',     username:'asiep.support',   email:'support@asiep.africa',         password:'Support2025!',role:'ADMIN',    university:'ASIEP HQ',                    country:'Tanzania' },
];

async function main() {
  console.log('🌍 Kutengeneza watumiaji wa ASIEP...\n');
  let created = 0, skipped = 0;

  for (const u of USERS) {
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: u.email }, { username: u.username }] }
    });
    if (exists) { console.log(`  ⏭  ${u.role.padEnd(8)} ${u.name}`); skipped++; continue; }
    const hashed = await bcrypt.hash(u.password, 12);
    await prisma.user.create({
      data: { name:u.name, username:u.username, email:u.email, password:hashed,
              role:u.role, university:u.university, country:u.country, isVerified:true }
    });
    const emoji = {STUDENT:'👤',MENTOR:'🎓',INVESTOR:'💰',COMPANY:'🏢',ADMIN:'👑'}[u.role];
    console.log(`  ${emoji} ${u.role.padEnd(8)} ${u.name} (${u.country})`);
    created++;
  }

  console.log(`\n✅ Wameundwa: ${created} | Walikuwepo: ${skipped}`);
  console.log('\n📋 LOGIN:');
  console.log('   admin@asiep.africa    → Admin2025!');
  console.log('   Wengine wote         → demo1234');
}

main().catch(e=>{console.error('❌',e.message);process.exit(1);}).finally(()=>prisma.$disconnect());