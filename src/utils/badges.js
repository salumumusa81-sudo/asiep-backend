const prisma = require('../config/db');

// ─── Badge definitions ────────────────────────────────────────────────────────
const BADGE_DEFINITIONS = [
  // INNOVATION
  { key:'first_upload',    name:'First Upload',     description:'Weka mradi wako wa kwanza',           icon:'🌱', tier:'BRONZE',   category:'INNOVATION', requirement:1 },
  { key:'innovator',       name:'Innovator',         description:'Miradi 5 iliyowekwa',                 icon:'💡', tier:'SILVER',   category:'INNOVATION', requirement:5 },
  { key:'serial_builder',  name:'Serial Builder',    description:'Miradi 10+ iliyowekwa',               icon:'🔥', tier:'GOLD',     category:'INNOVATION', requirement:10 },
  { key:'top_innovator',   name:'Top Innovator',     description:'Innovation Score juu ya 8,000',       icon:'🏆', tier:'PLATINUM', category:'INNOVATION', requirement:8000 },
  { key:'ip_guardian',     name:'IP Guardian',       description:'IP Certificates 3+ zimetolewa',       icon:'🛡️', tier:'BRONZE',   category:'INNOVATION', requirement:3 },

  // COLLABORATION
  { key:'team_player',     name:'Team Player',       description:'Shiriki katika mradi wa kwanza',      icon:'👥', tier:'BRONZE',   category:'COLLABORATION', requirement:1 },
  { key:'pan_african',     name:'Pan-African',        description:'Shiriki na watu kutoka nchi 3+',      icon:'🌍', tier:'SILVER',   category:'COLLABORATION', requirement:3 },
  { key:'connector',       name:'Connector',          description:'Washirika 10+ wameunganishwa',        icon:'🔗', tier:'GOLD',     category:'COLLABORATION', requirement:10 },
  { key:'mentor_seeker',   name:'Mentor Seeker',     description:'Ombi la kwanza la mentorship',        icon:'🎓', tier:'BRONZE',   category:'COLLABORATION', requirement:1 },

  // IMPACT
  { key:'trending',        name:'Trending',           description:'Views 500+ kwa wiki moja',            icon:'📈', tier:'SILVER',   category:'IMPACT', requirement:500 },
  { key:'viral',           name:'Viral Project',      description:'Views 1,000+ kwenye mradi mmoja',     icon:'🚀', tier:'GOLD',     category:'IMPACT', requirement:1000 },
  { key:'challenge_hero',  name:'Challenge Hero',     description:'Jiunge na challenge ya kwanza',       icon:'⚡', tier:'BRONZE',   category:'IMPACT', requirement:1 },
  { key:'challenge_winner',name:'Challenge Winner',   description:'Shinda challenge rasmi',              icon:'🥇', tier:'PLATINUM', category:'IMPACT', requirement:1 },

  // SPECIAL
  { key:'early_adopter',   name:'Early Adopter',     description:'Mwanachama wa kwanza wa ASIEP',       icon:'⭐', tier:'GOLD',     category:'SPECIAL', requirement:1 },
  { key:'profile_complete',name:'Profile Complete',  description:'Jaza wasifu wako wote',               icon:'✨', tier:'BRONZE',   category:'SPECIAL', requirement:1 },
];

// ─── Seed badges into DB ──────────────────────────────────────────────────────
const seedBadges = async () => {
  for (const badge of BADGE_DEFINITIONS) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: badge,
      create: badge,
    });
  }
  console.log(`✅ ${BADGE_DEFINITIONS.length} badges seeded`);
};

// ─── Check and award badges ───────────────────────────────────────────────────
const checkAndAwardBadges = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projects: true,
      collaborations: true,
      ipCertificates: true,
      menteeships: true,
      challengeEntries: true,
      badges: { include: { badge: true } },
    },
  });

  if (!user) return [];

  const earnedKeys = user.badges.map(b => b.badge.key);
  const newBadges = [];

  const award = async (key) => {
    if (earnedKeys.includes(key)) return;
    const badge = await prisma.badge.findUnique({ where: { key } });
    if (!badge) return;
    await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });

    // Send notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'BADGE',
        message: `🏅 Badge mpya: "${badge.icon} ${badge.name}" — ${badge.description}`,
        link: `/profile/${user.username}`,
      },
    });
    newBadges.push(badge);
  };

  const projectCount   = user.projects.length;
  const collabCount    = user.collaborations.length;
  const certCount      = user.ipCertificates.length;
  const mentorCount    = user.menteeships.length;
  const challengeCount = user.challengeEntries.length;

  // Innovation badges
  if (projectCount >= 1)  await award('first_upload');
  if (projectCount >= 5)  await award('innovator');
  if (projectCount >= 10) await award('serial_builder');
  if (certCount >= 3)     await award('ip_guardian');

  // Collaboration badges
  if (collabCount >= 1)  await award('team_player');
  if (collabCount >= 10) await award('connector');
  if (mentorCount >= 1)  await award('mentor_seeker');

  // Impact badges
  if (challengeCount >= 1) await award('challenge_hero');

  // Special badges
  await award('early_adopter');

  // Profile complete check
  if (user.name && user.bio && user.university && user.country) {
    await award('profile_complete');
  }

  return newBadges;
};

module.exports = { BADGE_DEFINITIONS, seedBadges, checkAndAwardBadges };
