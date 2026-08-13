const prisma = require('../config/db');
const { addPoints } = require('./points.controller');

// ── GET ALL CHALLENGES ────────────────────────────────────────────────────────
const getChallenges = async (req, res, next) => {
  try {
    const challenges = await prisma.challenge.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { entries: true } },
      },
    });
    res.json({ challenges });
  } catch(err) { next(err); }
};

// ── GET SINGLE CHALLENGE ──────────────────────────────────────────────────────
const getChallenge = async (req, res, next) => {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: req.params.id },
      include: {
        entries: {
          include: {
            user: { select: { id: true, name: true, username: true, university: true } },
          },
          orderBy: { score: 'desc' },
        },
        _count: { select: { entries: true } },
      },
    });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    res.json({ challenge });
  } catch(err) { next(err); }
};

// ── CREATE CHALLENGE ──────────────────────────────────────────────────────────
const createChallenge = async (req, res, next) => {
  try {
    const { title, description, prize, deadline, company, category, tags } = req.body;
    if (!title || !description || !prize || !deadline) {
      return res.status(400).json({ error: 'Title, description, prize and deadline are required' });
    }

    const challenge = await prisma.challenge.create({
      data: {
        title,
        description,
        prize: Number(prize),
        deadline: new Date(deadline),
        company: company || req.user?.name || 'Company',
        category: category || 'General',
        tags: tags || [],
        createdById: req.user?.id,
      },
    });

    // Notify all students
    try {
      const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true },
      });
      if (students.length > 0) {
        await prisma.notification.createMany({
          data: students.map(s => ({
            userId: s.id,
            type: 'CHALLENGE',
            message: `🏆 New challenge: "${title}" — Prize $${Number(prize).toLocaleString()}!`,
            link: '/challenges',
          })),
          skipDuplicates: true,
        });
      }
    } catch(e) {}

    res.status(201).json({ message: 'Challenge posted successfully!', challenge });
  } catch(err) { next(err); }
};

// ── UPDATE CHALLENGE ──────────────────────────────────────────────────────────
const updateChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, prize, deadline, company, category, tags, isActive } = req.body;

    const existing = await prisma.challenge.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Challenge not found' });

    if (existing.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

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

    res.json({ message: 'Challenge updated successfully!', challenge });
  } catch(err) { next(err); }
};

// ── DELETE CHALLENGE ──────────────────────────────────────────────────────────
const deleteChallenge = async (req, res, next) => {
  try {
    const existing = await prisma.challenge.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Challenge not found' });

    if (existing.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.challenge.delete({ where: { id: req.params.id } });
    res.json({ message: 'Challenge deleted successfully!' });
  } catch(err) { next(err); }
};

// ── JOIN CHALLENGE ────────────────────────────────────────────────────────────
const enterChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const challenge = await prisma.challenge.findUnique({ where: { id } });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (!challenge.isActive) return res.status(400).json({ error: 'Challenge is no longer active' });

    // Check already joined
    const existing = await prisma.challengeEntry.findUnique({
      where: { challengeId_userId: { challengeId: id, userId } },
    });
    if (existing) return res.status(409).json({ error: 'You have already joined this challenge' });

    // Create entry
    const entry = await prisma.challengeEntry.create({
      data: { challengeId: id, userId, status: 'REGISTERED' },
    });

    // Notification
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: 'CHALLENGE_JOIN',
          message: `✅ You have joined "${challenge.title}"! Deadline: ${new Date(challenge.deadline).toLocaleDateString('en')}`,
          link: '/challenges',
        },
      });
    } catch(e) {}

    // Points
    try {
      await addPoints(userId, 50, 'CHALLENGE_JOIN', `Joined challenge: ${challenge.title}`);
    } catch(e) {}

    res.status(201).json({ message: 'Successfully joined the challenge!', entry });
  } catch(err) { next(err); }
};

// ── SUBMIT SOLUTION ───────────────────────────────────────────────────────────
const submitSolution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { projectUrl, note } = req.body;
    const userId = req.user.id;

    const entry = await prisma.challengeEntry.findUnique({
      where: { challengeId_userId: { challengeId: id, userId } },
    });
    if (!entry) return res.status(404).json({ error: 'You have not joined this challenge' });
    if (entry.status === 'SUBMITTED') return res.status(400).json({ error: 'Solution already submitted' });

    const updated = await prisma.challengeEntry.update({
      where: { challengeId_userId: { challengeId: id, userId } },
      data: {
        status: 'SUBMITTED',
        projectUrl: projectUrl || null,
        note: note || null,
        submittedAt: new Date(),
      },
    });

    // Points
    try {
      await addPoints(userId, 150, 'CHALLENGE_SUBMIT', `Submitted solution for: ${id}`);
    } catch(e) {}

    res.json({ message: 'Solution submitted successfully!', entry: updated });
  } catch(err) { next(err); }
};

// ── GET MY ENTRIES ────────────────────────────────────────────────────────────
const getMyEntries = async (req, res, next) => {
  try {
    const entries = await prisma.challengeEntry.findMany({
      where: { userId: req.user.id },
      include: {
        challenge: {
          include: { _count: { select: { entries: true } } },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
    res.json({ entries });
  } catch(err) { next(err); }
};

// ── GET LEADERBOARD ───────────────────────────────────────────────────────────
const getLeaderboard = async (req, res, next) => {
  try {
    const entries = await prisma.challengeEntry.findMany({
      where: { challengeId: req.params.id },
      include: {
        user: { select: { id: true, name: true, username: true, university: true, country: true } },
      },
      orderBy: [{ score: 'desc' }, { submittedAt: 'asc' }],
    });

    const ranked = entries.map((e, i) => ({ ...e, rank: i + 1 }));
    res.json({ leaderboard: ranked });
  } catch(err) { next(err); }
};

// ── REVIEW ENTRY (Admin/Company) ──────────────────────────────────────────────
const reviewEntry = async (req, res, next) => {
  try {
    const { entryId } = req.params;
    const { status, score, reviewNote } = req.body;

    const entry = await prisma.challengeEntry.update({
      where: { id: entryId },
      data: {
        status,
        score: score ? Number(score) : undefined,
        reviewNote: reviewNote || null,
        reviewedById: req.user.id,
        reviewedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true } },
        challenge: { select: { title: true } },
      },
    });

    // Notify winner
    if (status === 'WINNER') {
      try {
        await addPoints(entry.userId, 500, 'CHALLENGE_WIN', `Won challenge: ${entry.challenge.title}`);
        await prisma.notification.create({
          data: {
            userId: entry.userId,
            type: 'CHALLENGE_WIN',
            message: `🏆 Congratulations! You won the "${entry.challenge.title}" challenge!`,
            link: '/challenges',
          },
        });
      } catch(e) {}
    }

    if (status === 'SHORTLISTED') {
      try {
        await addPoints(entry.userId, 300, 'CHALLENGE_SHORTLIST', `Shortlisted in: ${entry.challenge.title}`);
        await prisma.notification.create({
          data: {
            userId: entry.userId,
            type: 'CHALLENGE_SHORTLIST',
            message: `⭐ You were shortlisted in "${entry.challenge.title}"!`,
            link: '/challenges',
          },
        });
      } catch(e) {}
    }

    res.json({ message: 'Entry reviewed successfully!', entry });
  } catch(err) { next(err); }
};

module.exports = {
  getChallenges,
  getChallenge,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  enterChallenge,
  submitSolution,
  getMyEntries,
  getLeaderboard,
  reviewEntry,
};