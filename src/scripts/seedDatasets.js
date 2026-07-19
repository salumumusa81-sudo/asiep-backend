require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('🗄️ Kuweka datasets...');

  const admin = await p.user.findFirst({ where:{ role:'ADMIN' } });
  if (!admin) { console.log('❌ Hakuna admin — run seedAllUsers.js kwanza'); return; }

  const DATASETS = [
    {
      name: 'Swahili Twitter Corpus 2024',
      description: 'Dataset kubwa ya tweets za Kiswahili zenye maoni, majina, na mada mbalimbali. Imekusanywa 2020-2024 kutoka Tanzania, Kenya, na Uganda. Inafaa kwa NLP, sentiment analysis, na named entity recognition.',
      category: 'Text / NLP',
      tags: ['NLP','Swahili','Sentiment','Twitter'],
      size: '1.8 GB',
      format: 'JSON, CSV',
      language: 'Kiswahili',
      license: 'CC BY 4.0',
      access: 'FREE',
      downloadUrl: 'https://example.com/datasets/swahili-twitter',
      sourceUrl: 'https://udsm.ac.tz/datasets',
      records: 2400000,
      downloads: 3241,
      stars: 4.8,
      isVerified: true,
    },
    {
      name: 'East Africa Medical Records Dataset',
      description: 'Rekodi za wagonjwa zilizofichwa kutoka hospitali 12 Kenya, Tanzania, Uganda. IRB imeidhinisha. Inafaa kwa AI ya afya, utabiri wa magonjwa, na clinical decision support.',
      category: 'Health',
      tags: ['Health','Clinical','EHR','Africa'],
      size: '450 MB',
      format: 'CSV, FHIR JSON',
      language: 'English',
      license: 'Restricted',
      access: 'REQUEST',
      downloadUrl: null,
      sourceUrl: 'https://muchs.ac.tz',
      records: 120000,
      downloads: 1872,
      stars: 4.6,
      isVerified: true,
    },
    {
      name: 'Tanzania Soil Quality Survey',
      description: 'Data ya ubora wa udongo kutoka mikoa 15 Tanzania. Ina pH, virutubisho, na matokeo ya mazao. Inafaa kwa AI ya kilimo, utabiri wa mavuno, na mipango ya kilimo endelevu.',
      category: 'Agriculture',
      tags: ['AgriTech','Soil','Tanzania','Climate'],
      size: '280 MB',
      format: 'CSV, GeoJSON',
      language: 'English, Swahili',
      license: 'CC BY 4.0',
      access: 'FREE',
      downloadUrl: 'https://example.com/datasets/tanzania-soil',
      sourceUrl: 'https://sua.ac.tz',
      records: 48000,
      downloads: 987,
      stars: 4.9,
      isVerified: true,
    },
    {
      name: 'Nairobi Traffic Dataset 2024',
      description: 'Data ya msongamano wa magari kutoka sensory 200+ Nairobi kwa wakati halisi. Ina data ya hali ya hewa, nyakati za kilele, na maeneo ya foleni. Inafaa kwa smart city solutions.',
      category: 'Smart Cities',
      tags: ['IoT','Transport','Nairobi','Smart Cities'],
      size: '3.2 GB',
      format: 'CSV, Parquet',
      language: 'English',
      license: 'MIT',
      access: 'FREE',
      downloadUrl: 'https://example.com/datasets/nairobi-traffic',
      sourceUrl: 'https://ardhi.ac.tz',
      records: 2100000,
      downloads: 2156,
      stars: 4.7,
      isVerified: true,
    },
    {
      name: 'Hausa Speech Corpus',
      description: 'Dataset ya sauti ya Hausa yenye masaa 500 na maandishi. Inashughulikia habari, mazungumzo, na mada za kiufundi. Inafaa kwa speech recognition, TTS, na NLP ya Hausa.',
      category: 'Audio / NLP',
      tags: ['NLP','Hausa','Audio','Speech'],
      size: '8.4 GB',
      format: 'WAV, MP3, JSON',
      language: 'Hausa',
      license: 'CC BY 4.0',
      access: 'FREE',
      downloadUrl: 'https://example.com/datasets/hausa-speech',
      sourceUrl: 'https://buk.edu.ng',
      records: 50000,
      downloads: 654,
      stars: 4.5,
      isVerified: true,
    },
    {
      name: 'African Wildlife Images Dataset',
      description: 'Picha 180,000 za wanyamapori kutoka mbuga 8 Tanzania na Kenya. Kila picha ina maelezo ya aina ya mnyama na eneo. Inafaa kwa computer vision, species detection, na conservation AI.',
      category: 'Computer Vision',
      tags: ['CV','Wildlife','Images','Tanzania'],
      size: '12 GB',
      format: 'JPEG, PNG, JSON',
      language: 'English',
      license: 'Restricted',
      access: 'REQUEST',
      downloadUrl: null,
      sourceUrl: 'https://tawiri.or.tz',
      records: 180000,
      downloads: 4521,
      stars: 4.9,
      isVerified: true,
    },
    {
      name: 'M-Pesa Transaction Patterns',
      description: 'Data ya mwenendo wa malipo ya M-Pesa iliyofichwa kutoka Kenya na Tanzania. Inafaa kwa fintech AI, fraud detection, na financial inclusion research.',
      category: 'Fintech',
      tags: ['Fintech','Mobile Money','Kenya','Tanzania'],
      size: '650 MB',
      format: 'CSV, JSON',
      language: 'English',
      license: 'Restricted',
      access: 'REQUEST',
      downloadUrl: null,
      sourceUrl: null,
      records: 5000000,
      downloads: 892,
      stars: 4.7,
      isVerified: false,
    },
    {
      name: 'Amharic News Corpus',
      description: 'Makala 50,000 za habari za Kiamhari kutoka vyombo vikubwa vya habari Ethiopia. Inafaa kwa text classification, summarization, na NLP ya lugha za Ethiopia.',
      category: 'Text / NLP',
      tags: ['NLP','Amharic','Ethiopia','News'],
      size: '2.1 GB',
      format: 'JSON, TXT',
      language: 'Amharic',
      license: 'CC BY 4.0',
      access: 'FREE',
      downloadUrl: 'https://example.com/datasets/amharic-news',
      sourceUrl: null,
      records: 50000,
      downloads: 1203,
      stars: 4.4,
      isVerified: true,
    },
  ];

  for (const ds of DATASETS) {
    try {
      await p.dataset.create({
        data: { ...ds, contributorId: admin.id },
      });
      console.log(`✅ ${ds.name}`);
    } catch(err) {
      console.log(`⚠️ ${ds.name}: ${err.message.slice(0,60)}`);
    }
  }

  console.log('✅ Datasets zote zimewekwa!');
}

main().catch(console.error).finally(()=>p.$disconnect());