const prisma = require('../config/db');
const { createCertificateData } = require('../utils/ipCertificate');
const { addPoints } = require('./points.controller');

// ─── GET ALL PROJECTS ────────────────────────────────────────────────────────
const getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, tag, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(tag && { tags: { some: { tag: { name: tag } } } }),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where, skip, take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true, username: true, avatar: true, university: true } },
          tags: { include: { tag: true } },
          ipCertificate: { select: { certificateId: true, issuedAt: true } },
          _count: { select: { collaborators: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      projects,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
};

// ─── GET SINGLE PROJECT ──────────────────────────────────────────────────────
const getProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, name: true, username: true, avatar: true, university: true, bio: true } },
        tags: { include: { tag: true } },
        collaborators: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        ipCertificate: true,
      },
    });

    if (!project) return res.status(404).json({ error: 'Mradi haukupatikana' });
    await prisma.project.update({ where: { id: project.id }, data: { views: { increment: 1 } } });
    res.json({ project });
  } catch (err) { next(err); }
};

// ─── CREATE PROJECT ──────────────────────────────────────────────────────────
const createProject = async (req, res, next) => {
  try {
    const { title, description, fullContent, demoUrl, repoUrl, visibility, tags } = req.body;

    const project = await prisma.project.create({
      data: {
        title, description, fullContent, demoUrl, repoUrl,
        visibility: visibility || 'PUBLIC',
        status: 'PUBLISHED',
        authorId: req.user.id,
        tags: {
          create: tags?.map(tagName => ({
            tag: { connectOrCreate: { where: { name: tagName }, create: { name: tagName } } },
          })) || [],
        },
      },
      include: { tags: { include: { tag: true } } },
    });

    // IP Certificate
    const certData = createCertificateData(project, req.user);
    const certificate = await prisma.ipCertificate.create({
      data: {
        projectId: project.id,
        ownerId: req.user.id,
        contentHash: certData.contentHash,
        metadata: certData.metadata,
      },
    });

    // ── Points ──
    try { await addPoints(req.user.id, 'PROJECT_UPLOAD', `Umeweka mradi: ${project.title}`); } catch(e) {}

    res.status(201).json({
      message: 'Mradi umeundwa na IP Certificate imetolewa!',
      project,
      ipCertificate: certificate,
    });
  } catch (err) { next(err); }
};

// ─── UPDATE PROJECT ──────────────────────────────────────────────────────────
const updateProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Mradi haukupatikana' });
    if (project.authorId !== req.user.id) return res.status(403).json({ error: 'Huna ruhusa ya kubadilisha mradi huu' });

    const { title, description, fullContent, demoUrl, repoUrl, visibility, status } = req.body;
    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: { title, description, fullContent, demoUrl, repoUrl, visibility, status },
    });

    res.json({ message: 'Mradi umesasishwa', project: updated });
  } catch (err) { next(err); }
};

// ─── DELETE PROJECT ──────────────────────────────────────────────────────────
const deleteProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Mradi haukupatikana' });
    if (project.authorId !== req.user.id) return res.status(403).json({ error: 'Huna ruhusa' });

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Mradi umefutwa' });
  } catch (err) { next(err); }
};

// ─── LIKE PROJECT ─────────────────────────────────────────────────────────────
const likeProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: 'Mradi haukupatikana' });

    const updated = await prisma.project.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });

    res.json({ message: 'Umependa mradi huu!', likes: updated.likes });
  } catch(err) { next(err); }
};

// ─── GET MY PROJECTS ──────────────────────────────────────────────────────────
const getMyProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { authorId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        tags: { include: { tag: true } },
        ipCertificate: { select: { certificateId: true, issuedAt: true } },
        _count: { select: { collaborators: true } },
      },
    });
    res.json({ projects });
  } catch(err) { next(err); }
};

// ─── ADD COMMENT ──────────────────────────────────────────────────────────────
const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Andika maoni kwanza' });

    const comment = await prisma.projectComment.create({
      data: {
        content: content.trim(),
        projectId: req.params.id,
        authorId: req.user.id,
      },
      include: {
        author: { select: { id:true, name:true, username:true, avatar:true, university:true } },
      },
    });

    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      select: { authorId:true, title:true },
    });

    if (project && project.authorId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: project.authorId,
          type: 'COMMENT',
          message: `💬 ${req.user.name} ameandika maoni kwenye mradi wako "${project.title}"`,
          link: `/projects/${req.params.id}`,
        },
      });
    }

    // ── Points ──
    try { await addPoints(req.user.id, 'COMMENT', `Umeandika maoni kwenye mradi`); } catch(e) {}

    res.status(201).json({ comment });
  } catch(err) { next(err); }
};

// ─── GET COMMENTS ─────────────────────────────────────────────────────────────
const getComments = async (req, res, next) => {
  try {
    const comments = await prisma.projectComment.findMany({
      where: { projectId: req.params.id },
      include: {
        author: { select: { id:true, name:true, username:true, avatar:true, university:true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ comments });
  } catch(err) { next(err); }
};

module.exports = {
  getProjects, getProject, createProject, updateProject,
  deleteProject, likeProject, getMyProjects, addComment, getComments,
};