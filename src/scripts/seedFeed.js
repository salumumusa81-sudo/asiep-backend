const prisma = require('../config/db');

const POSTS = [
  { username:'amara.kamau', type:'MILESTONE', content:'🚀 Breakthrough! Swahili NLP model yangu imefika 91% accuracy! Nimetumia transformer architecture na dataset ya tweets 50k. Hii inaweza kubadilisha jinsi makampuni ya Afrika yanavyoelewa wateja wao. Nitashare paper wiki ijayo! #NLP #Swahili #AI' },
  { username:'fatuma.ngozi', type:'UPDATE', content:'🌾 Smart Irrigation system yetu imepunguza matumizi ya maji kwa 43% kwenye mashamba 15 Morogoro! Wakulima wanatupigia simu kila siku. Sasa tunaomba grant ya Safaricom kupanua. Mtu ana uzoefu wa IoT anahitajika kwenye timu! 👥' },
  { username:'kwame.mensah', type:'QUESTION', content:'💡 Swali kwa community: Mnafikiria AI inaweza kusaidia zaidi katika sekta gani ya Afrika? Health, AgriTech, Education, au Fintech? Shauri zenu! 🤔 #AfricanAI' },
  { username:'aisha.diallo', type:'MILESTONE', content:'🏆 HABARI NJEMA! SACCO Digital Ledger imepata watumiaji 1,200 ndani ya miezi 6! Vikundi 45 vya akiba sasa vinatumia blockchain yetu. Hakuna mtu amepoteza shilingi moja. 💪' },
  { username:'amara.kamau', type:'OPPORTUNITY', content:'🌍 Fursa: Nafasi 3 za ushirikiano kwenye mradi wa AI Traffic Management Dar es Salaam. Tunahitaji: ML Engineer, Computer Vision Developer, na Data Analyst. Remote-friendly! #TechJobs' },
  { username:'brian.oduya', type:'SHOWCASE', content:'🎯 Showcase: AfyaConnect imefanikiwa kuunganisha zaidi ya kliniki 200 Kenya! Wagonjwa sasa wanaweza kufuatilia rekodi zao za afya na kupanga miadi online. Next stop: Uganda na Tanzania! 🌍' },
  { username:'grace.okonkwo', type:'UPDATE', content:'📚 Update: EduLearn AI Assistant sasa inasaidia wanafunzi 5,000+ kujifunza hesabu. Matokeo ya majaribio yanaonyesha wanafunzi wanaboresha alama zao kwa wastani wa 34%. #EdTech #AI' },
  { username:'kofi.mensah', type:'MILESTONE', content:'🎓 Nilipata PhD leo! Thesis yangu ilikuwa kuhusu "Machine Learning Applications in African Agriculture". Shukrani kwa ASIEP community kwa support yote! Sasa twende kubadilisha Afrika! 🌍🎉' },
];

async function main() {
  console.log('🌱 Seeding feed posts...');

  for (const p of POSTS) {
    const user = await prisma.user.findFirst({ where: { username: p.username } });
    if (!user) { console.log(`❌ User ${p.username} not found`); continue; }

    await prisma.feedPost.create({
      data: {
        content: p.content,
        type: p.type,
        authorId: user.id,
        likes: Math.floor(Math.random() * 100),
      },
    });
    console.log(`✅ Post ya ${p.username} imewekwa`);
  }

  console.log('✅ Feed seeded!');
}

main().catch(console.error).finally(() => prisma.$disconnect());