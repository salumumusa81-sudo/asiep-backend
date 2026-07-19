const prisma = require('../config/db');
const { addPoints } = require('./points.controller');

// ── GET ALL CHALLENGES ────────────────────────────────────────────────────────
const getChallenges = async (req, res, next) => {
  try {
    const { search, category, active } = req.query;
    const where = {};

    if (active !== 'false') where.isActive = true;
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (category) where.category = { contains: category, mode: 'insensitive' };

    const challenges = await prisma.challenge.findMany({
      where,
      orderBy: { deadline: 'asc' },
      include: {
        _count: { select: { entries: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    res.json({ challenges });
  } catch(err) { next(err); }
};

// ── GET ONE CHALLENGE ─────────────────────────────────────────────────────────
const getChallenge = async (req, res, next) => {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { entries: true } },
        entries: {
          include: {
            user: { select: { id: true, name: true, username: true, university: true, country: true, avatar: true } },
            project: { select: { id: true, title: true, description: true, demoUrl: true, repoUrl: true } },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!challenge) return res.status(404).json({ error: 'Challenge haipatikani' });
    res.json({ challenge });
  } catch(err) { next(err); }
};

// ── CREATE CHALLENGE ──────────────────────────────────────────────────────────
const createChallenge = async (req, res, next) => {
  try {
    const { title, description, prize, deadline, company, category, tags } = req.body;

    if (!title || !description || !prize || !deadline || !company) {
      return res.status(400).json({ error: 'Jaza sehemu zote muhimu' });
    }

    const challenge = await prisma.challenge.create({
      data: {
        title, description,
        prize: Number(prize),
        deadline: new Date(deadline),
        company,
        category: category || 'General',
        tags: tags || [],
        createdById: req.user?.id,
      },
    });

    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: students.map(s => ({
        userId: s.id,
        type: 'CHALLENGE',
        message: `🏆 Challenge mpya: "${title}" — Prize $${Number(prize).toLocaleString()}!`,
        link: '/challenges',
      })),
      skipDuplicates: true,
    });

    res.status(201).json({ message: 'Challenge imewekwa!', challenge });
  } catch(err) { next(err); }
};

// ── UPDATE CHALLENGE ──────────────────────────────────────────────────────────
const updateChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, prize, deadline, company, category, tags, isActive } = req.body;

    const existing = await prisma.challenge.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Challenge haipatikani' });

    const challenge = await prisma.challenge.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(prize && { prize: Number(prize) }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(company && { company }),
        ...(category && { category }),
        ...(tags && { tags }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ message: 'Challenge imesasishwa!', challenge });
  } catch(err) { next(err); }
};

// ── DELETE CHALLENGE ──────────────────────────────────────────────────────────
const deleteChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.challengeEntry.deleteMany({ where: { challengeId: id } });
    await prisma.challenge.delete({ where: { id } });
    res.json({ message: 'Challenge imefutwa!' });
  } catch(err) { next(err); }
};

// ── JOIN CHALLENGE ────────────────────────────────────────────────────────────
const enterChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const challenge = await prisma.challenge.findUnique({ where: { id } });
    if (!challenge) return res.status(404).json({ error: 'Challenge haipatikani' });
    if (!challenge.isActive) return res.status(400).json({ error: 'Challenge hii haifanyi kazi tena' });

    const deadline = new Date(challenge.deadline);
    if (deadline < new Date()) return res.status(400).json({ error: 'Deadline imepita' });

    const existing = await prisma.challengeEntry.findUnique({
      where: { challengeId_userId: { challengeId: id, userId } },
    });
    if (existing) return res.status(400).json({ error: 'Umejisajili kwenye challenge hii tayari!' });

    const entry = await prisma.challengeEntry.create({
      data: { challengeId: id, userId, status: 'REGISTERED' },
      include: {
        challenge: { select: { title: true, prize: true, deadline: true } },
        user: { select: { name: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: 'CHALLENGE_JOIN',
        message: `✅ Umejisajili kwenye "${challenge.title}"! Deadline: ${new Date(challenge.deadline).toLocaleDateString('sw')}`,
        link: '/challenges',
      },
    });

    // ── Points ──
    try { await addPoints(userId, 'CHALLENGE_JOIN', `Umejoin: ${challenge.title}`); } catch(e) {}

    res.status(201).json({ message: 'Umesajiliwa rasmi kwenye challenge!', entry });
  } catch(err) { next(err); }
};

// ── SUBMIT SOLUTION ───────────────────────────────────────────────────────────
const submitSolution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { projectUrl, note, projectId } = req.body;

    if (!projectUrl) return res.status(400).json({ error: 'Weka link ya mradi wako' });

    const entry = await prisma.challengeEntry.findUnique({
      where: { challengeId_userId: { challengeId: id, userId } },
      include: { challenge: true },
    });

    if (!entry) return res.status(404).json({ error: 'Hujajisajili kwenye challenge hii' });
    if (entry.status === 'WINNER') return res.status(400).json({ error: 'Umeshashinda challenge hii!' });

    const deadline = new Date(entry.challenge.deadline);
    if (deadline < new Date()) return res.status(400).json({ error: 'Deadline imepita' });

    const updated = await prisma.challengeEntry.update({
      where: { challengeId_userId: { challengeId: id, userId } },
      data: {
        status: 'SUBMITTED',
        projectUrl,
        note: note || null,
        projectId: projectId || null,
        submittedAt: new Date(),
      },
      include: {
        challenge: { select: { title: true, company: true } },
        user: { select: { name: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: 'CHALLENGE_SUBMIT',
        message: `🚀 Suluhisho lako kwa "${entry.challenge.title}" limewasilishwa! Subiri matokeo.`,
        link: '/challenges',
      },
    });

    // ── Points ──
    try { await addPoints(userId, 'CHALLENGE_SUBMIT', `Umewasilisha: ${entry.challenge.title}`); } catch(e) {}

    res.json({ message: 'Suluhisho limewasilishwa!', entry: updated });
  } catch(err) { next(err); }
};

// ── GET ENTRIES ───────────────────────────────────────────────────────────────
const getEntries = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const where = { challengeId: id };
    if (status && status !== 'ALL') where.status = status;

    const entries = await prisma.challengeEntry.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, username: true, university: true, country: true, avatar: true } },
        project: { select: { id: true, title: true, description: true, demoUrl: true, repoUrl: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ status: 'asc' }, { submittedAt: 'desc' }],
    });

    const stats = {
      total: entries.length,
      REGISTERED: entries.filter(e => e.status === 'REGISTERED').length,
      SUBMITTED: entries.filter(e => e.status === 'SUBMITTED').length,
      SHORTLISTED: entries.filter(e => e.status === 'SHORTLISTED').length,
      WINNER: entries.filter(e => e.status === 'WINNER').length,
      REJECTED: entries.filter(e => e.status === 'REJECTED').length,
    };

    res.json({ entries, stats });
  } catch(err) { next(err); }
};

// ── UPDATE ENTRY STATUS ───────────────────────────────────────────────────────
const updateEntryStatus = async (req, res, next) => {
  try {
    const { id, entryId } = req.params;
    const { status, score, reviewNote } = req.body;
    const reviewerId = req.user.id;

    const validStatuses = ['REGISTERED','SUBMITTED','SHORTLISTED','WINNER','REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status si sahihi' });
    }

    const entry = await prisma.challengeEntry.update({
      where: { id: entryId },
      data: {
        status,
        ...(score !== undefined && { score: Number(score) }),
        ...(reviewNote && { reviewNote }),
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true } },
        challenge: { select: { title: true, prize: true } },
      },
    });

    const notifMsgs = {
      SHORTLISTED: `⭐ Hongera! Umefika finalist kwenye "${entry.challenge.title}"!`,
      WINNER: `🏆 HONGERA SANA! Umeshinda "${entry.challenge.title}"! Prize: $${entry.challenge.prize.toLocaleString()}.`,
      REJECTED: `❌ Samahani, suluhisho lako kwa "${entry.challenge.title}" halijakubaliwa.`,
    };

    if (notifMsgs[status]) {
      await prisma.notification.create({
        data: {
          userId: entry.user.id,
          type: `CHALLENGE_${status}`,
          message: notifMsgs[status],
          link: '/challenges',
        },
      });
    }

    // ── Points ──
    if (status === 'WINNER') {
      try { await addPoints(entry.user.id, 'CHALLENGE_WIN', `🏆 Umeshinda: ${entry.challenge.title}!`); } catch(e) {}
    }
    if (status === 'SHORTLISTED') {
      try { await addPoints(entry.user.id, 'CHALLENGE_SHORTLISTED', `⭐ Umechaguliwa: ${entry.challenge.title}`); } catch(e) {}
    }

    res.json({ message: 'Entry imesasishwa!', entry });
  } catch(err) { next(err); }
};

// ── GET MY CHALLENGES ─────────────────────────────────────────────────────────
const getMyChallenges = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const entries = await prisma.challengeEntry.findMany({
      where: { userId },
      include: {
        challenge: { include: { _count: { select: { entries: true } } } },
        project: { select: { id: true, title: true, demoUrl: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json({ entries });
  } catch(err) { next(err); }
};

// ── GET CHALLENGE STATS ───────────────────────────────────────────────────────
const getChallengeStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        _count: { select: { entries: true } },
        entries: { select: { status: true, score: true, submittedAt: true } },
      },
    });

    if (!challenge) return res.status(404).json({ error: 'Challenge haipatikani' });

    const entries = challenge.entries;
    const stats = {
      total: entries.length,
      registered: entries.filter(e => e.status === 'REGISTERED').length,
      submitted: entries.filter(e => e.status === 'SUBMITTED').length,
      shortlisted: entries.filter(e => e.status === 'SHORTLISTED').length,
      winners: entries.filter(e => e.status === 'WINNER').length,
      rejected: entries.filter(e => e.status === 'REJECTED').length,
      avgScore: entries.filter(e => e.score).length > 0
        ? entries.filter(e => e.score).reduce((a, b) => a + b.score, 0) / entries.filter(e => e.score).length
        : 0,
      submissionRate: entries.length > 0
        ? Math.round((entries.filter(e => e.status !== 'REGISTERED').length / entries.length) * 100)
        : 0,
    };

    res.json({ challenge, stats });
  } catch(err) { next(err); }
};

// ── GET LEADERBOARD ───────────────────────────────────────────────────────────
const getLeaderboard = async (req, res, next) => {
  try {
    const { id } = req.params;

    const entries = await prisma.challengeEntry.findMany({
      where: {
        challengeId: id,
        status: { in: ['SUBMITTED','SHORTLISTED','WINNER','REJECTED'] },
      },
      include: {
        user: {
          select: { id:true, name:true, username:true, university:true, country:true, avatar:true },
        },
      },
      orderBy: [{ score: 'desc' }, { submittedAt: 'asc' }],
    });

    const ranked = entries.map((e, i) => ({
      rank: i + 1,
      userId: e.userId,
      name: e.user.name,
      username: e.user.username,
      university: e.user.university,
      country: e.user.country,
      score: e.score || 0,
      status: e.status,
      submittedAt: e.submittedAt,
      projectUrl: e.projectUrl,
    }));

    const stats = {
      total: entries.length,
      submitted: entries.filter(e=>e.status==='SUBMITTED').length,
      shortlisted: entries.filter(e=>e.status==='SHORTLISTED').length,
      winner: entries.filter(e=>e.status==='WINNER').length,
      avgScore: entries.filter(e=>e.score).length > 0
        ? Math.round(entries.filter(e=>e.score).reduce((s,e)=>s+(e.score||0),0) / entries.filter(e=>e.score).length)
        : 0,
      topCountries: [...new Set(entries.map(e=>e.user.country).filter(Boolean))].slice(0,5),
      topUniversities: [...new Set(entries.map(e=>e.user.university).filter(Boolean))].slice(0,5),
    };

    res.json({ leaderboard: ranked, stats });
  } catch(err) { next(err); }
};

module.exports = {
  getChallenges, getChallenge, createChallenge, updateChallenge,
  deleteChallenge, enterChallenge, submitSolution, getEntries,
  updateEntryStatus, getMyChallenges, getChallengeStats, getLeaderboard,
};