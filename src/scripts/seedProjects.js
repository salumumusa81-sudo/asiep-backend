require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { createCertificateData } = require('../utils/ipCertificate');
const p = new PrismaClient();

async function main() {
  console.log('💡 Kuweka miradi...');

  // Pata users wa STUDENT
  const students = await p.user.findMany({
    where: { role: 'STUDENT' },
    take: 6,
  });

  if (students.length === 0) {
    console.log('❌ Hakuna students — run seedAllUsers.js kwanza');
    return;
  }

  const PROJECTS = [
    {
      title: 'Swahili NLP Sentiment Analysis',
      description: 'AI model inayoelewa hisia za Kiswahili kwa biashara za Afrika Mashariki.',
      fullContent: 'Mradi huu unajenga AI model inayoweza kuelewa hisia za lugha ya Kiswahili. Tumetumia transformer architecture na dataset ya tweets 50,000. Model inafanya kazi kwa biashara zinazotaka kuelewa wateja wao. Usahihi wa model ni 91% kwenye test dataset.',
      demoUrl: 'https://swahili-nlp.demo.com',
      repoUrl: 'https://github.com/amara/swahili-nlp',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      views: 1842,
      likes: 124,
      tags: ['AI / ML', 'Kiswahili', 'NLP'],
    },
    {
      title: 'Smart Irrigation IoT System',
      description: 'Mfumo wa umwagiliaji unaotumia sensors na SMS alerts kwa wakulima wadogo.',
      fullContent: 'Smart Irrigation ni mfumo wa IoT unaosaidia wakulima wadogo kupunguza matumizi ya maji kwa 43%. Tumia sensors za bei nafuu na Raspberry Pi. Wakulima wanapata SMS alerts moja kwa moja kwenye simu zao za kawaida.',
      demoUrl: 'https://smart-irrigation.demo.com',
      repoUrl: 'https://github.com/fatuma/smart-irrigation',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      views: 1205,
      likes: 98,
      tags: ['AgriTech', 'IoT', 'SMS'],
    },
    {
      title: 'Malaria Detection Mobile App',
      description: 'App inayotumia computer vision kutambua dalili za malaria kupitia picha.',
      fullContent: 'Malaria Detection App inatumia TensorFlow Lite kwenye Android kutambua dalili za malaria kupitia picha za microscope. App inafanya kazi bila internet na imefunzwa kutumia dataset ya picha 10,000. Usahihi ni 94%.',
      demoUrl: 'https://malaria-detect.demo.com',
      repoUrl: 'https://github.com/kwame/malaria-detect',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      views: 2341,
      likes: 287,
      tags: ['Health', 'AI / ML', 'Mobile'],
    },
    {
      title: 'SACCO Digital Ledger',
      description: 'Mfumo wa blockchain kwa vikundi vya akiba vijijini Afrika.',
      fullContent: 'SACCO Digital Ledger inatumia blockchain technology kusimamia akiba za vikundi vya SACCO. Vikundi 45 vinatumia mfumo huu. Fedha $120,000 zinasimamishwa. Zero fraud imerekodiwa tangu kuanzishwa.',
      demoUrl: 'https://sacco-ledger.demo.com',
      repoUrl: 'https://github.com/aisha/sacco-ledger',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      views: 654,
      likes: 89,
      tags: ['Fintech', 'Blockchain'],
    },
    {
      title: 'AgroPredict Disease Detection',
      description: 'AI inayotabiri magonjwa ya mazao kupitia WhatsApp kwa usahihi wa 91%.',
      fullContent: 'AgroPredict ni AI inayosaidia wakulima kutambua magonjwa ya mazao kwa kupiga picha na kutuma WhatsApp. Bot inajibu ndani ya sekunde 10 na kutoa ushauri wa dawa. Wakulima 3,400 wanatumia bot hii.',
      demoUrl: 'https://agropredict.demo.com',
      repoUrl: 'https://github.com/brian/agropredict',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      views: 987,
      likes: 76,
      tags: ['AgriTech', 'AI / ML', 'WhatsApp'],
    },
    {
      title: 'EduLearn AI Tutor',
      description: 'AI tutor anayesaidia wanafunzi kwa lugha za Afrika — Kiswahili, Hausa, Amharic.',
      fullContent: 'EduLearn ni AI tutor anayesaidia wanafunzi wa Afrika kujifunza kwa lugha zao za asili. Anasaidia kwa Kiswahili, Hausa, na Amharic. Wanafunzi 5,000 wanatumia platform hii kila siku.',
      demoUrl: 'https://edulearn.demo.com',
      repoUrl: 'https://github.com/grace/edulearn',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      views: 543,
      likes: 65,
      tags: ['Education', 'AI / ML', 'Mobile'],
    },
  ];

  for (let i = 0; i < PROJECTS.length; i++) {
    const proj = PROJECTS[i];
    const student = students[i % students.length];
    const { tags, ...projectData } = proj;

    try {
      const project = await p.project.create({
        data: {
          ...projectData,
          authorId: student.id,
          tags: {
            create: tags.map(tagName => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: { name: tagName },
                },
              },
            })),
          },
        },
      });

      // IP Certificate
      const certData = createCertificateData(project, student);
      await p.ipCertificate.create({
        data: {
          projectId: project.id,
          ownerId: student.id,
          contentHash: certData.contentHash,
          metadata: certData.metadata,
        },
      });

      console.log(`✅ ${project.title}`);
    } catch(err) {
      console.log(`❌ ${proj.title}: ${err.message}`);
    }
  }

  console.log('✅ Miradi yote imewekwa!');
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());