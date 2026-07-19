const prisma = require('../config/db');

const userSelect = { id:true, name:true, username:true, avatar:true, university:true };

// Get all startups
const getStartups = async (req, res, next) => {
  try {
    const { stage, sector, page=1, limit=12 } = req.query;
    const skip = (Number(page)-1) * Number(limit);
    const where = {
      isPublic: true,
      ...(stage && { stage }),
      ...(sector && { sector }),
    };
    const [startups, total] = await Promise.all([
      prisma.startup.findMany({
        where, skip, take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          founder: { select: userSelect },
          coFounders: { include: { user: { select: userSelect } } },
          _count: { select: { milestones:true, investorInterests:true } },
        },
      }),
      prisma.startup.count({ where }),
    ]);
    res.json({ startups, total });
  } catch(err) { next(err); }
};

// Get single startup
const getStartup = async (req, res, next) => {
  try {
    const startup = await prisma.startup.findUnique({
      where: { id: req.params.id },
      include: {
        founder: { select: { ...userSelect, bio:true } },
        coFounders: { include: { user: { select: userSelect } } },
        milestones: { orderBy: { createdAt: 'asc' } },
        project: { select: { id:true, title:true, description:true } },
        _count: { select: { investorInterests:true } },
      },
    });
    if (!startup) return res.status(404).json({ error: 'Startup haipatikani' });
    res.json({ startup });
  } catch(err) { next(err); }
};

// Create startup
const createStartup = async (req, res, next) => {
  try {
    const { name, tagline, description, stage, sector, country, website, demoUrl, fundingGoal, equity, projectId } = req.body;
    if (!name||!tagline||!description) return res.status(400).json({ error: 'Jina, tagline, na maelezo vinahitajika' });

    const startup = await prisma.startup.create({
      data: {
        name, tagline, description,
        stage: stage||'IDEA', sector, country,
        website, demoUrl, fundingGoal, equity,
        projectId: projectId||null,
        founderId: req.user.id,
        milestones: {
          create: [
            { title:'Unda MVP (Toleo la Msingi)', status:'PENDING' },
            { title:'Pata watumiaji wa kwanza 100', status:'PENDING' },
            { title:'Thibitisha mapato ya kwanza', status:'PENDING' },
            { title:'Omba ufadhili wa kwanza', status:'PENDING' },
            { title:'Pata wawekezaji wa seed round', status:'PENDING' },
          ],
        },
      },
      include: {
        founder: { select: userSelect },
        milestones: true,
      },
    });

    // Notification
    await prisma.notification.create({
      data: {
        userId: req.user.id, type:'STARTUP',
        message:`🚀 Startup yako "${name}" imesajiliwa kwenye ASIEP Launchpad! Wawekezaji wanaweza kukuona sasa.`,
        link: `/launchpad/${startup.id}`,
      },
    });

    res.status(201).json({ message:'Startup imesajiliwa! 🚀', startup });
  } catch(err) { next(err); }
};

// Update milestone
const updateMilestone = async (req, res, next) => {
  try {
    const { status } = req.body;
    const milestone = await prisma.startupMilestone.update({
      where: { id: req.params.milestoneId },
      data: { status, completedAt: status==='COMPLETED' ? new Date() : null },
    });
    res.json({ milestone });
  } catch(err) { next(err); }
};

// Express investor interest
const expressInterest = async (req, res, next) => {
  try {
    const { message, amount } = req.body;
    const startup = await prisma.startup.findUnique({ where: { id:req.params.id } });
    if (!startup) return res.status(404).json({ error: 'Startup haipatikani' });

    const interest = await prisma.investorInterest.create({
      data: { startupId:req.params.id, investorId:req.user.id, message, amount },
    });

    // Notify founder
    await prisma.notification.create({
      data: {
        userId: startup.founderId, type:'INVESTOR',
        message:`💰 Mwekezaji ametoa nia ya kuwekeza kwenye "${startup.name}"! ${amount?`Kiasi: $${amount.toLocaleString()}`:''}`,
        link: `/launchpad/${startup.id}`,
      },
    });

    res.status(201).json({ message:'Nia ya uwekezaji imetumwa!', interest });
  } catch(err) {
    if (err.code==='P2002') return res.status(409).json({ error:'Tayari umetoa nia kwa startup hii' });
    next(err);
  }
};

// Get my startups
const getMyStartups = async (req, res, next) => {
  try {
    const startups = await prisma.startup.findMany({
      where: { founderId: req.user.id },
      include: {
        milestones: { orderBy: { createdAt:'asc' } },
        _count: { select: { investorInterests:true } },
      },
      orderBy: { createdAt:'desc' },
    });
    res.json({ startups });
  } catch(err) { next(err); }
};

module.exports = { getStartups, getStartup, createStartup, updateMilestone, expressInterest, getMyStartups };
