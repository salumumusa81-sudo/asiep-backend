const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ASIEP database...');
  const hash = await bcrypt.hash('demo1234', 10);
  const adminHash = await bcrypt.hash('Admin2025!', 10);

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({ data: {
    name:'ASIEP Admin', email:'admin@asiep.africa', password:adminHash,
    username:'asiep.admin', role:'ADMIN', isVerified:true,
    university:'ASIEP HQ', country:'Africa', bio:'Platform administrator',
  }});

  // ── COMPANIES ─────────────────────────────────────────────────────────────
  const safaricom = await prisma.user.create({ data: {
    name:'Safaricom Innovation', email:'innovation@safaricom.co.ke', password:hash,
    username:'safaricom.innovation', role:'COMPANY', isVerified:true,
    university:'Safaricom PLC', country:'Kenya',
    bio:'Leading telecommunications and technology company in East Africa.',
  }});

  const flutterwave = await prisma.user.create({ data: {
    name:'Flutterwave Africa', email:'africa@flutterwave.com', password:hash,
    username:'flutterwave.africa', role:'COMPANY', isVerified:true,
    university:'Flutterwave Inc.', country:'Nigeria',
    bio:'Building payment infrastructure for Africa and the world.',
  }});

  const microsoft = await prisma.user.create({ data: {
    name:'Microsoft Africa', email:'africa@microsoft.com', password:hash,
    username:'microsoft.africa', role:'COMPANY', isVerified:true,
    university:'Microsoft Corporation', country:'South Africa',
    bio:'Empowering every person and organization on the planet to achieve more.',
  }});

  // ── INVESTORS ─────────────────────────────────────────────────────────────
  const bashir = await prisma.user.create({ data: {
    name:'Bashir Okonkwo', email:'bashir@demo.asiep.africa', password:hash,
    username:'bashir.vc', role:'INVESTOR', isVerified:true,
    university:'Partech Africa', country:'Nigeria',
    bio:'Venture capitalist focused on African tech startups. $200M+ deployed.',
  }});

  const zainab = await prisma.user.create({ data: {
    name:'Zainab Traore', email:'zainab@demo.asiep.africa', password:hash,
    username:'zainab.traore', role:'INVESTOR', isVerified:true,
    university:'TLcom Capital', country:'Senegal',
    bio:'Impact investor backing African founders building solutions for Africa.',
  }});

  const marcus = await prisma.user.create({ data: {
    name:'Marcus Asante', email:'marcus@demo.asiep.africa', password:hash,
    username:'marcus.asante', role:'INVESTOR', isVerified:true,
    university:'Angels Africa Network', country:'Ghana',
    bio:'Angel investor and entrepreneur. Co-founder of 3 successful African startups.',
  }});

  // ── MENTORS ───────────────────────────────────────────────────────────────
  const kofi = await prisma.user.create({ data: {
    name:'Dr. Kofi Mensah', email:'kofi@demo.asiep.africa', password:hash,
    username:'kofi.mensah', role:'MENTOR', isVerified:true,
    university:'University of Ghana', country:'Ghana',
    bio:'15 years in AI research. Published 40+ papers. Specializes in African language NLP and machine learning for low-resource languages.',
  }});

  const sarah = await prisma.user.create({ data: {
    name:'Sarah Akeju', email:'sarah@demo.asiep.africa', password:hash,
    username:'sarah.akeju', role:'MENTOR', isVerified:true,
    university:'MIT (Alumni)', country:'Nigeria',
    bio:'Former Flutterwave VP Engineering. Passionate about African fintech and helping founders scale payment products across Africa.',
  }});

  const amina = await prisma.user.create({ data: {
    name:'Dr. Amina Njoroge', email:'amina@demo.asiep.africa', password:hash,
    username:'amina.njoroge', role:'MENTOR', isVerified:true,
    university:'Stanford (Alumni)', country:'Kenya',
    bio:'Leading health technology initiatives across 15 African countries. Former Stanford researcher specializing in AI diagnostics.',
  }});

  const emmanuel = await prisma.user.create({ data: {
    name:'Emmanuel Waweru', email:'emmanuel@demo.asiep.africa', password:hash,
    username:'emmanuel.waweru', role:'MENTOR', isVerified:true,
    university:'Strathmore University', country:'Kenya',
    bio:'Co-founder of Twiga Foods. Revolutionizing food distribution in Kenya. Built supply chain serving 50,000+ farmers.',
  }});

  const laila = await prisma.user.create({ data: {
    name:'Laila Diallo', email:'laila@demo.asiep.africa', password:hash,
    username:'laila.diallo', role:'MENTOR', isVerified:true,
    university:'UCT Cape Town', country:'South Africa',
    bio:'VP Product at MTN Group. Expert in mobile-first African products and UX for emerging markets.',
  }});

  // ── STUDENTS ──────────────────────────────────────────────────────────────
  const amara = await prisma.user.create({ data: {
    name:'Amara Kamau', email:'amara@demo.asiep.africa', password:hash,
    username:'amara.kamau', role:'STUDENT', isVerified:true,
    university:'University of Dar es Salaam', country:'Tanzania',
    bio:'Computer Science student passionate about AI and machine learning for African language processing.',
  }});

  const kwame = await prisma.user.create({ data: {
    name:'Kwame Mensah', email:'kwame@demo.asiep.africa', password:hash,
    username:'kwame.mensah', role:'STUDENT', isVerified:true,
    university:'KNUST Kumasi', country:'Ghana',
    bio:'Software engineering student building smart agriculture solutions for smallholder farmers in West Africa.',
  }});

  const fatuma = await prisma.user.create({ data: {
    name:'Fatuma Ngozi', email:'fatuma@demo.asiep.africa', password:hash,
    username:'fatuma.ngozi', role:'STUDENT', isVerified:true,
    university:'University of Nairobi', country:'Kenya',
    bio:'Environmental engineering student developing IoT solutions for precision irrigation in East Africa.',
  }});

  const brian = await prisma.user.create({ data: {
    name:'Brian Oduya', email:'brian@demo.asiep.africa', password:hash,
    username:'brian.oduya', role:'STUDENT', isVerified:true,
    university:'Makerere University', country:'Uganda',
    bio:'Health informatics student building digital health solutions for rural communities in Sub-Saharan Africa.',
  }});

  const grace = await prisma.user.create({ data: {
    name:'Grace Okonkwo', email:'grace@demo.asiep.africa', password:hash,
    username:'grace.okonkwo', role:'STUDENT', isVerified:true,
    university:'University of Lagos', country:'Nigeria',
    bio:'EdTech entrepreneur building AI-powered personalized learning for African students.',
  }});

  const neema = await prisma.user.create({ data: {
    name:'Neema Hassan', email:'neema@demo.asiep.africa', password:hash,
    username:'neema.hassan', role:'STUDENT', isVerified:true,
    university:'Ardhi University', country:'Tanzania',
    bio:'Urban planning student using GIS and AI for smart city development in East Africa.',
  }});

  const chidi = await prisma.user.create({ data: {
    name:'Chidi Okafor', email:'chidi@demo.asiep.africa', password:hash,
    username:'chidi.okafor', role:'STUDENT', isVerified:true,
    university:'University of Ghana', country:'Ghana',
    bio:'Fintech developer building blockchain solutions for cross-border payments in West Africa.',
  }});

  const aisha = await prisma.user.create({ data: {
    name:'Aisha Diallo', email:'aisha@demo.asiep.africa', password:hash,
    username:'aisha.diallo', role:'STUDENT', isVerified:true,
    university:'Universite Cheikh Anta Diop', country:'Senegal',
    bio:'Data scientist applying machine learning to agricultural yield prediction in the Sahel region.',
  }});

  console.log('✅ Users created!');

  // ── PROJECTS ──────────────────────────────────────────────────────────────
  await prisma.project.create({ data: {
    title:'Swahili NLP Transformer',
    description:'A state-of-the-art NLP model trained on 50,000+ Swahili texts. Achieves 91% accuracy on sentiment analysis and 89% on named entity recognition.',
    demoUrl:'https://github.com/amara-kamau/swahili-nlp',
    status:'PUBLISHED', views:342, authorId:amara.id,
  }});

  await prisma.project.create({ data: {
    title:'SmartIrrigation — IoT Precision Farming',
    description:'IoT-powered smart irrigation system that reduces water consumption by 43% while improving crop yields by 28%. Deployed on 15 farms in Morogoro, Tanzania.',
    demoUrl:'https://github.com/fatuma-ngozi/smart-irrigation',
    status:'PUBLISHED', views:287, authorId:fatuma.id,
  }});

  await prisma.project.create({ data: {
    title:'AfyaConnect — Digital Health Platform',
    description:'Telemedicine platform connecting 200+ clinics across Kenya with rural patients. Features appointment booking, electronic health records, and AI-powered symptom checker.',
    demoUrl:'https://github.com/brian-oduya/afyaconnect',
    status:'PUBLISHED', views:423, authorId:brian.id,
  }});

  await prisma.project.create({ data: {
    title:'EduLearn AI — Personalized Learning Platform',
    description:'AI-powered adaptive learning platform for 5,000+ students across Nigeria. Students show 34% improvement in math scores after 30 days.',
    demoUrl:'https://github.com/grace-okonkwo/edulearn-ai',
    status:'PUBLISHED', views:198, authorId:grace.id,
  }});

  await prisma.project.create({ data: {
    title:'SACCO Digital Ledger — Blockchain Banking',
    description:'Blockchain-based digital ledger for SACCO organizations in Ghana. Serving 45 SACCOs with 1,200+ members. Zero funds lost since deployment.',
    demoUrl:'https://github.com/chidi-okafor/sacco-ledger',
    status:'PUBLISHED', views:156, authorId:chidi.id,
  }});

  await prisma.project.create({ data: {
    title:'Dar Smart City — Urban Traffic AI',
    description:'AI-powered traffic management for Dar es Salaam using computer vision. Reduces commute time by 22% and emergency response time by 35%.',
    demoUrl:'https://github.com/neema-hassan/dar-smart-city',
    status:'PUBLISHED', views:231, authorId:neema.id,
  }});

  await prisma.project.create({ data: {
    title:'CropYield Predictor — Sahel Agriculture AI',
    description:'ML model predicting crop yields in the Sahel using satellite imagery and weather data. Trained on 10 years of data across 6 countries.',
    demoUrl:'https://github.com/aisha-diallo/crop-yield-predictor',
    status:'PUBLISHED', views:178, authorId:aisha.id,
  }});

  console.log('✅ Projects created!');

  // ── CHALLENGES ────────────────────────────────────────────────────────────
  const d30 = new Date(); d30.setDate(d30.getDate() + 30);
  const d45 = new Date(); d45.setDate(d45.getDate() + 45);
  const d60 = new Date(); d60.setDate(d60.getDate() + 60);

  await prisma.challenge.create({ data: {
    title:'African Fintech Innovation Challenge',
    description:'Build a fintech solution that solves a real financial inclusion problem in Africa.',
    prize:5000, deadline:d30, company:'Flutterwave Africa',
    isActive:true, createdById:flutterwave.id,
  }});

  await prisma.challenge.create({ data: {
    title:'AI for Agriculture in East Africa',
    description:'Develop an AI-powered solution to help smallholder farmers increase yields and access markets.',
    prize:3000, deadline:d45, company:'Safaricom Innovation',
    isActive:true, createdById:safaricom.id,
  }});

  await prisma.challenge.create({ data: {
    title:'Smart City Solutions for African Capitals',
    description:'Design and prototype a smart city solution for any African capital city.',
    prize:7500, deadline:d60, company:'Microsoft Africa',
    isActive:true, createdById:microsoft.id,
  }});

  await prisma.challenge.create({ data: {
    title:'Health Tech Innovation for Rural Africa',
    description:'Create a health technology solution for rural communities in Africa working in low-bandwidth environments.',
    prize:4000, deadline:d45, company:'Safaricom Innovation',
    isActive:true, createdById:safaricom.id,
  }});

  console.log('✅ Challenges created!');

  // ── GRANTS ────────────────────────────────────────────────────────────────
  await prisma.sponsorGrant.create({ data: {
    title:'Safaricom Innovation Fund 2025',
    description:'Supporting innovative tech solutions addressing challenges in East Africa.',
    amount:10000, deadline:d45, category:'Technology',
    sponsorName:'Safaricom Innovation',
    requirements:'Must be East African student or graduate. Project must have working prototype.',
    status:'OPEN',
  }});

  await prisma.sponsorGrant.create({ data: {
    title:'Flutterwave Fintech Grant',
    description:'Funding the next generation of African fintech innovators.',
    amount:15000, deadline:d60, category:'Fintech',
    sponsorName:'Flutterwave Africa',
    requirements:'Fintech focus required. Must demonstrate financial inclusion impact.',
    status:'OPEN',
  }});

  await prisma.sponsorGrant.create({ data: {
    title:'Microsoft Africa AI Research Grant',
    description:'Supporting AI research and development in Africa.',
    amount:20000, deadline:d60, category:'AI / ML',
    sponsorName:'Microsoft Africa',
    requirements:'Must use AI/ML. Preference for African language AI projects.',
    status:'OPEN',
  }});

  await prisma.sponsorGrant.create({ data: {
    title:'East Africa AgriTech Innovation Grant',
    description:'Supporting agricultural technology solutions for smallholder farmers.',
    amount:8000, deadline:d30, category:'AgriTech',
    sponsorName:'Safaricom Innovation',
    requirements:'Must target smallholder farmers. Must be deployable in rural areas.',
    status:'OPEN',
  }});

  console.log('✅ Grants created!');

  // ── DATASETS ──────────────────────────────────────────────────────────────
  await prisma.dataset.create({ data: {
  title:'Swahili News Corpus 2024',
  description:'80,000+ Swahili news articles from major East African newspapers.',
  category:'Text / NLP',  // ← ONGEZA
  language:'Swahili', size:'2.4 GB', format:'CSV',
  license:'CC BY 4.0', isPublic:true, downloads:342,
  downloadUrl:'https://github.com/example/swahili-news-corpus',
  uploaderId:amara.id,
}});

await prisma.dataset.create({ data: {
  title:'East Africa Agricultural Yield Dataset',
  description:'10 years of crop yield data from Kenya, Tanzania, Uganda, and Ethiopia.',
  category:'Agriculture',  // ← ONGEZA
  language:'English', size:'850 MB', format:'CSV',
  license:'CC BY-NC 4.0', isPublic:true, downloads:187,
  downloadUrl:'https://github.com/example/ea-agricultural-yield',
  uploaderId:fatuma.id,
}});

await prisma.dataset.create({ data: {
  title:'African Health Records Dataset',
  description:'Anonymized health records from 50 clinics across Kenya, Tanzania, and Uganda.',
  category:'Health',  // ← ONGEZA
  language:'English', size:'1.8 GB', format:'JSON',
  license:'CC BY 4.0', isPublic:false, downloads:89,
  downloadUrl:'https://github.com/example/african-health-records',
  uploaderId:brian.id,
}});

await prisma.dataset.create({ data: {
  title:'Nairobi Traffic Flow Dataset',
  description:'Real-time traffic flow data from 50 cameras at major Nairobi intersections.',
  category:'Smart Cities',  // ← ONGEZA
  language:'English', size:'4.2 GB', format:'CSV',
  license:'MIT', isPublic:true, downloads:124,
  downloadUrl:'https://github.com/example/nairobi-traffic',
  uploaderId:neema.id,
}});

await prisma.dataset.create({ data: {
  title:'West Africa Financial Transactions Dataset',
  description:'Anonymized mobile money transaction data from Ghana and Nigeria.',
  category:'Fintech',  // ← ONGEZA
  language:'English', size:'3.1 GB', format:'Parquet',
  license:'Apache 2.0', isPublic:true, downloads:256,
  downloadUrl:'https://github.com/example/wa-financial-transactions',
  uploaderId:chidi.id,
}});

  console.log('✅ Datasets created!');

  // ── STARTUPS ──────────────────────────────────────────────────────────────
  await prisma.startup.create({ data: {
    name:'LinguaAI',
    tagline:'AI-powered Swahili language tools for East African businesses',
    description:'LinguaAI builds NLP tools for East African languages. Products include customer service chatbot, content moderation API, and translation service for 200M+ Swahili speakers.',
    stage:'BETA', sector:'AI / ML', country:'Tanzania',
    website:'https://linguaai.co.tz',
    fundingGoal:250000, equity:12, isActive:true,
    founderId:amara.id,
  }});

  await prisma.startup.create({ data: {
    name:'FarmSense',
    tagline:'IoT precision farming for smallholder farmers in East Africa',
    description:'FarmSense provides affordable IoT sensors and AI analytics for smallholder farmers. Solar-powered sensors monitor soil and nutrients via SMS. Deployed on 200+ farms.',
    stage:'MVP', sector:'AgriTech', country:'Kenya',
    website:'https://farmsense.africa',
    fundingGoal:150000, equity:15, isActive:true,
    founderId:fatuma.id,
  }});

  await prisma.startup.create({ data: {
    name:'AfyaLink',
    tagline:'Connecting rural patients to quality healthcare across Africa',
    description:'AfyaLink is a telemedicine platform for Africa. Connects rural patients to doctors via video calls and AI-assisted diagnosis. Works on 2G networks.',
    stage:'LAUNCHED', sector:'Health', country:'Kenya',
    website:'https://afyalink.health',
    fundingGoal:500000, equity:10, isActive:true,
    founderId:brian.id,
  }});

  await prisma.startup.create({ data: {
    name:'PayChain Africa',
    tagline:'Instant cross-border payments for African businesses',
    description:'PayChain enables instant, low-cost cross-border payments between African countries using blockchain. Supports 15 currencies. Serving 500+ SMEs.',
    stage:'SCALING', sector:'Fintech', country:'Ghana',
    website:'https://paychain.africa',
    fundingGoal:1000000, equity:8, isActive:true,
    founderId:chidi.id,
  }});

  console.log('✅ Startups created!');

  // ── FEED POSTS ────────────────────────────────────────────────────────────
  await prisma.feedPost.createMany({ data: [
    { content:'🚀 Excited to share that our Swahili NLP model has achieved 91% accuracy on sentiment analysis! After 6 months of training on 50,000+ texts, we can now understand Swahili language at scale. The model is now open-source! #SwahiliNLP #AfricanAI', type:'MILESTONE', authorId:amara.id, likes:87 },
    { content:'🌾 Big news from the field! SmartIrrigation has reduced water usage by 43% on 15 farms in Morogoro. Farmers are seeing 28% higher yields. Scaling to 100 farms next season! #AgriTech #Tanzania', type:'MILESTONE', authorId:fatuma.id, likes:124 },
    { content:'📱 AfyaConnect just hit 15,000 monthly active patients! Doctors in Nairobi are consulting with patients 400km away. Healthcare access is a right, not a privilege. #HealthTech #Kenya', type:'MILESTONE', authorId:brian.id, likes:203 },
    { content:'💡 What is the biggest challenge you face when building tech products for African markets? For me it\'s connectivity — designing for 2G changes everything. Share your experiences! #AfricanTech', type:'QUESTION', authorId:kwame.id, likes:56 },
    { content:'🏆 We just won the Ghana National Innovation Prize for SACCO Digital Ledger! 45 savings groups, 1,200 members, zero funds lost. Blockchain builds community trust. #Blockchain #Ghana', type:'MILESTONE', authorId:chidi.id, likes:178 },
    { content:'🌍 Looking for 2 collaborators for my smart city project in Dar es Salaam! Need: Computer Vision engineer and Backend developer. Pilot starting March with City Council. DM me! #SmartCity', type:'OPPORTUNITY', authorId:neema.id, likes:34 },
    { content:'📊 CropYield Predictor now covers 6 Sahel countries with 78% accuracy on yield predictions 3 months ahead. Working with 3 NGOs for food security planning. #ML #Agriculture', type:'UPDATE', authorId:aisha.id, likes:91 },
    { content:'🎓 Just got accepted to the ASIEP Mentorship Program with Dr. Kofi Mensah! Having the right mentor is everything. Apply for mentorship today! #Mentorship #ASIEP', type:'UPDATE', authorId:grace.id, likes:45 },
  ]});

  console.log('✅ Feed posts created!');

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
  const allStudents = [amara, kwame, fatuma, brian, grace, neema, chidi, aisha];
  await prisma.notification.createMany({ data: allStudents.map(u => ({
    userId: u.id,
    type:'SYSTEM',
    message:'🎉 Welcome to ASIEP! Your African innovation journey starts here. Upload your first project!',
    link:'/projects/new',
  }))});

  console.log('✅ Notifications created!');
  console.log('');
  console.log('🎉 ASIEP database seeded successfully!');
  console.log('');
  console.log('📋 Login credentials:');
  console.log('👑 Admin:     admin@asiep.africa / Admin2025!');
  console.log('🎓 Students:  amara@demo.asiep.africa / demo1234');
  console.log('             kwame@demo.asiep.africa / demo1234');
  console.log('             fatuma@demo.asiep.africa / demo1234');
  console.log('👨‍🏫 Mentors:   kofi@demo.asiep.africa / demo1234');
  console.log('             sarah@demo.asiep.africa / demo1234');
  console.log('💰 Investors: bashir@demo.asiep.africa / demo1234');
  console.log('🏢 Companies: innovation@safaricom.co.ke / demo1234');
}

main().catch(console.error).finally(()=>prisma.$disconnect());