const prisma = require('../config/db');
const { addPoints } = require('./points.controller');

// Get all grants
const getGrants = async (req, res, next) => {
  try {
    const { category, status = 'OPEN', page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      status,
      ...(category && { category }),
    };

    const [grants, total] = await Promise.all([
      prisma.sponsorGrant.findMany({
        where, skip, take: Number(limit),
        include: { _count: { select: { applications: true } } },
        orderBy: { deadline: 'asc' },
      }),
      prisma.sponsorGrant.count({ where }),
    ]);

    res.json({ grants, total, page: Number(page) });
  } catch (err) { next(err); }
};

// Get single grant
const getGrant = async (req, res, next) => {
  try {
    const grant = await prisma.sponsorGrant.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { applications: true } } },
    });
    if (!grant) return res.status(404).json({ error: 'Grant not found' });
    res.json({ grant });
  } catch (err) { next(err); }
};

// Apply for grant
const applyForGrant = async (req, res, next) => {
  try {
    const { pitch, projectUrl } = req.body;
    if (!pitch) return res.status(400).json({ error: 'Pitch is required' });

    const grant = await prisma.sponsorGrant.findUnique({ where: { id: req.params.id } });
    if (!grant) return res.status(404).json({ error: 'Grant not found' });
    if (grant.status !== 'OPEN') return res.status(400).json({ error: 'Grant is closed' });

    const application = await prisma.grantApplication.create({
      data: {
        pitch,
        projectUrl: projectUrl || null,
        grantId: req.params.id,
        userId: req.user.id,
      },
      include: {
        grant: { select: { title: true, amount: true, sponsorName: true } },
      },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: req.user.id,
          type: 'GRANT',
          message: `✅ Your application for "${grant.title}" by ${grant.sponsorName} has been received!`,
          link: '/marketplace',
        },
      });
    } catch(e) {}

    try {
      await addPoints(req.user.id, 30, 'GRANT_APPLY', `Applied for grant: ${grant.title}`);
    } catch(e) {}

    res.status(201).json({ message: 'Application submitted successfully!', application });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'You have already applied for this grant' });
    next(err);
  }
};

// Get my applications
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await prisma.grantApplication.findMany({
      where: { userId: req.user.id },
      include: { grant: true },
      orderBy: { submittedAt: 'desc' },
    });
    res.json({ applications });
  } catch (err) { next(err); }
};

// Create grant
const createGrant = async (req, res, next) => {
  try {
    const { title, description, requirements, amount, category, deadline, sponsorName } = req.body;
    if (!title||!description||!amount||!deadline||!sponsorName) {
      return res.status(400).json({ error: 'Jaza sehemu zote muhimu' });
    }
    const grant = await prisma.sponsorGrant.create({
      data: {
        title, description,
        requirements: requirements || '',
        amount: Number(amount),
        category: category || 'General',
        deadline: new Date(deadline),
        sponsorName,
        status: 'OPEN',
      },
    });
    res.status(201).json({ message: 'Grant imewekwa!', grant });
  } catch(err) { next(err); }
};

// Update application status
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING','SHORTLISTED','APPROVED','REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status si sahihi' });
    }

    const application = await prisma.grantApplication.update({
      where: { id: applicationId },
      data: { status },
      include: {
        applicant: { select: { id: true, name: true } },
        grant: { select: { title: true, amount: true } },
      },
    });

    const msgs = {
      APPROVED: `🎉 Hongera! Ombi lako la "${application.grant.title}" limeidhinishwa! $${application.grant.amount.toLocaleString()} inakuja!`,
      SHORTLISTED: `⭐ Ombi lako la "${application.grant.title}" limechaguliwa!`,
      REJECTED: `❌ Ombi lako la "${application.grant.title}" halijakubaliwa.`,
    };

    if (msgs[status]) {
      await prisma.notification.create({
        data: {
          userId: application.applicant.id,
          type: 'GRANT_STATUS',
          message: msgs[status],
          link: '/marketplace',
        },
      });
    }

    // ── Points ──
    if (status === 'APPROVED') {
      try { await addPoints(application.applicant.id, 'GRANT_APPROVED', `✅ Grant imeidhinishwa: ${application.grant.title}`); } catch(e) {}
    }

    res.json({ message: 'Status imesasishwa!', application });
  } catch(err) { next(err); }
};

// Get applications for a grant
const getGrantApplications = async (req, res, next) => {
  try {
    const applications = await prisma.grantApplication.findMany({
      where: { grantId: req.params.id },
      include: {
  user: { select: { id:true, name:true, university:true, country:true, avatar:true } },
},
      orderBy: { submittedAt: 'desc' },
    });
    res.json({ applications });
  } catch(err) { next(err); }
};

module.exports = {
  getGrants, getGrant, applyForGrant, getMyApplications,
  createGrant, updateApplicationStatus, getGrantApplications,
};