const prisma = require('../config/db');

// ── GET ALL DATASETS ──────────────────────────────────────────────────────────
const getDatasets = async (req, res, next) => {
  try {
    const { search, category, access, page=1, limit=12 } = req.query;
    const skip = (Number(page)-1) * Number(limit);

    const where = {
      isPublic: true,
      ...(search && {
       OR: [
  { title: { contains: search, mode:'insensitive' } },
  { description: { contains: search, mode:'insensitive' } },
],
      }),
      ...(category && category!=='All' && { category }),
      ...(access && access!=='All' && { access }),
    };

    const [datasets, total] = await Promise.all([
      prisma.dataset.findMany({
        where, skip, take: Number(limit),
        orderBy: { downloads: 'desc' },
        include: {
  uploader: { select:{ id:true, name:true, username:true, university:true } },
  ratings: { select:{ rating:true } },
  _count: { select:{ ratings:true, accessRequests:true } },
},
      }),
      prisma.dataset.count({ where }),
    ]);

    res.json({ datasets, total, page: Number(page) });
  } catch(err) { next(err); }
};

// ── GET ONE DATASET ───────────────────────────────────────────────────────────
const getDataset = async (req, res, next) => {
  try {
    const dataset = await prisma.dataset.findUnique({
      where: { id: req.params.id },
      include: {
        contributor: { select:{ id:true, name:true, username:true, university:true, avatar:true } },
        ratings: {
          include: { user: { select:{ id:true, name:true, avatar:true } } },
          orderBy: { createdAt:'desc' },
          take: 10,
        },
        _count: { select:{ ratings:true, requests:true } },
      },
    });

    if (!dataset) return res.status(404).json({ error:'Dataset haipatikani' });
    res.json({ dataset });
  } catch(err) { next(err); }
};

// ── CREATE DATASET ────────────────────────────────────────────────────────────
const createDataset = async (req, res, next) => {
  try {
    
    const {
  title, description, category, size, format,
  language, license, isPublic, downloadUrl
} = req.body;
if (!title||!description||!category) {
  return res.status(400).json({ error:'Title, description and category are required' });
}
const dataset = await prisma.dataset.create({
  data: {
    title, description, category,
    size: size||null,
    format: format||null,
    language: language||null,
    license: license||'CC BY 4.0',
    isPublic: isPublic !== false,
    downloadUrl: downloadUrl||null,
    uploaderId: req.user.id,
  },
      include: {
  uploader: { select:{ id:true, name:true, username:true } },
},
    });

    // Notify all users
    const users = await prisma.user.findMany({
      where: { role:'STUDENT' },
      select: { id:true },
    });

    await prisma.notification.createMany({
      data: users.map(u=>({
        userId: u.id,
        type: 'DATASET',
        message: `🗄️ New dataset: "${title}" added by ${req.user.name}!`,
        link: '/datasets',
      })),
      skipDuplicates: true,
    });

    res.status(201).json({ message:'Dataset imewekwa!', dataset });
  } catch(err) { next(err); }
};

// ── DOWNLOAD DATASET ──────────────────────────────────────────────────────────
const downloadDataset = async (req, res, next) => {
  try {
    const dataset = await prisma.dataset.findUnique({ where:{ id:req.params.id } });
    if (!dataset) return res.status(404).json({ error:'Dataset haipatikani' });
    if (dataset.access==='REQUEST') {
      // Check if approved
      const request = await prisma.datasetAccessRequest.findUnique({
        where: { datasetId_userId:{ datasetId:req.params.id, userId:req.user.id } },
      });
      if (!request||request.status!=='APPROVED') {
        return res.status(403).json({ error:'Omba ruhusa kwanza' });
      }
    }

    // Increment downloads
   

    res.json({ message:'Download imeanzishwa!', downloadUrl:dataset.downloadUrl });
  } catch(err) { next(err); }
};

// ── REQUEST ACCESS ────────────────────────────────────────────────────────────
const requestAccess = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error:'Eleza sababu ya kuomba' });

    const dataset = await prisma.dataset.findUnique({ where:{ id:req.params.id } });
    if (!dataset) return res.status(404).json({ error:'Dataset haipatikani' });

    const request = await prisma.datasetAccessRequest.create({
      data: {
        reason,
        datasetId: req.params.id,
        userId: req.user.id,
      },
    });

    // Notify contributor
    await prisma.notification.create({
      data: {
        userId: dataset.uploaderId,
        type: 'DATASET_REQUEST',
        message: `🔍 ${req.user.name} is requesting access to "${dataset.title}"`,
        link: '/datasets',
      },
    });

    res.status(201).json({ message:'Ombi limetumwa!', request });
  } catch(err) {
    if (err.code==='P2002') return res.status(409).json({ error:'Umeshatuma ombi' });
    next(err);
  }
};

// ── RATE DATASET ──────────────────────────────────────────────────────────────
const rateDataset = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    if (!rating||rating<1||rating>5) return res.status(400).json({ error:'Rating must be 1-5' });
    await prisma.datasetRating.upsert({
      where: { datasetId_userId:{ datasetId:req.params.id, userId:req.user.id } },
      update: { rating:Number(rating), review:review||null },
      create: { datasetId:req.params.id, userId:req.user.id, rating:Number(rating), review:review||null },
    });
    const ratings = await prisma.datasetRating.findMany({ where:{ datasetId:req.params.id } });
    const avg = ratings.reduce((s,r)=>s+r.rating,0)/ratings.length;
    res.json({ message:'Rating submitted!', avgRating:avg });
  } catch(err) { next(err); }
};

// ── GET MY DATASETS ───────────────────────────────────────────────────────────
const getMyDatasets = async (req, res, next) => {
  try {
    const datasets = await prisma.dataset.findMany({
      where: { uploaderId:req.user.id },
include: {
  _count: { select:{ ratings:true, accessRequests:true } },
},
      orderBy: { createdAt:'desc' },
    });
    res.json({ datasets });
  } catch(err) { next(err); }
};

// ── ADMIN — UPDATE ACCESS REQUEST ─────────────────────────────────────────────
const updateAccessRequest = async (req, res, next) => {
  try {
    const { status } = req.body;
    const request = await prisma.datasetAccessRequest.update({
      where: { id:req.params.requestId },
      data: { status },
      include: {
        user: { select:{ id:true, name:true } },
        dataset: { select:{ name:true } },
      },
    });

    if (status==='APPROVED') {
      await prisma.notification.create({
        data: {
          userId: request.user.id,
          type: 'DATASET_APPROVED',
          message: `✅ Ombi lako la "${request.dataset.name}" limeidhinishwa! Unaweza kudownload sasa.`,
          link: '/datasets',
        },
      });
    }

    res.json({ message:'Imesasishwa!', request });
  } catch(err) { next(err); }
};

module.exports = {
  getDatasets, getDataset, createDataset, downloadDataset,
  requestAccess, rateDataset, getMyDatasets, updateAccessRequest,
};