const prisma = require('../config/db');
const { createCertificateData } = require('../utils/ipCertificate');
const { addPoints } = require('./points.controller');

// ── GET ALL PROJECTS ──────────────────────────────────────────────────────────
const getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, tag, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
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
          ipCertificate: { select: { id: true, issuedAt: true, contentHash: true } },
          _count: { select: { comments: true, collaborators: true } },
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

// ── GET SINGLE PROJECT ────────────────────────────────────────────────────────
const getProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, name: true, username: true, avatar: true, university: true, bio: true } },
        tags: { include: { tag: true } },
        collaborators: true,
        ipCertificate: true,
        comments: {
          include: { author: { select: { id: true, name: true, username: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { comments: true, collaborators: true } },
      },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await prisma.project.update({ where: { id: project.id }, data: { views: { increment: 1 } } });
    res.json({ project });
  } catch (err) { next(err); }
};

// ── GET MY PROJECTS ───────────────────────────────────────────────────────────
const getMyProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { authorId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        tags: { include: { tag: true } },
        ipCertificate: { select: { id: true, issuedAt: true, contentHash: true } },
        _count: { select: { comments: true, collaborators: true } },
      },
    });
    res.json({ projects });
  } catch (err) { next(err); }
};

// ── CREATE PROJECT ────────────────────────────────────────────────────────────
const createProject = async (req, res, next) => {
  try {
    const { title, description, fullContent, demoUrl, repoUrl, visibility, tags } = req.body;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        fullContent: fullContent || null,
        demoUrl: demoUrl || null,
        repoUrl: repoUrl || null,
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

    // ── Generate IP Certificate ──
    try {
      const certData = createCertificateData({
        projectId: project.id,
        projectTitle: project.title,
        ownerId: req.user.id,
        ownerName: req.user.name,
        ownerEmail: req.user.email,
        university: req.user.university,
      });

      await prisma.ipCertificate.create({
        data: {
          projectId: project.id,
          ownerId: req.user.id,
          userId: req.user.id,
          contentHash: certData.hash,
          hash: certData.hash,
          metadata: certData.metadata,
        },
      });
    } catch (certErr) {
      console.error('IP Certificate error:', certErr);
    }

    // ── Add points ──
    try {
      await addPoints(req.user.id, 100, 'PROJECT_UPLOAD', `Uploaded project: ${project.title}`);
    } catch (e) {}

    res.status(201).json({ project, message: 'Project created successfully!' });
  } catch (err) { next(err); }
};

// ── UPDATE PROJECT ────────────────────────────────────────────────────────────
const updateProject = async (req, res, next) => {
  try {
    const { title, description, fullContent, demoUrl, repoUrl, visibility, status, tags } = req.body;

    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Project not found' });
    if (existing.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete old tags
    await prisma.projectTag.deleteMany({ where: { projectId: req.params.id } });

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(fullContent !== undefined && { fullContent }),
        ...(demoUrl !== undefined && { demoUrl }),
        ...(repoUrl !== undefined && { repoUrl }),
        ...(visibility && { visibility }),
        ...(status && { status }),
        tags: {
          create: tags?.map(tagName => ({
            tag: { connectOrCreate: { where: { name: tagName }, create: { name: tagName } } },
          })) || [],
        },
      },
      include: {
        tags: { include: { tag: true } },
        ipCertificate: true,
      },
    });

    res.json({ project, message: 'Project updated successfully!' });
  } catch (err) { next(err); }
};

// ── DELETE PROJECT ────────────────────────────────────────────────────────────
const deleteProject = async (req, res, next) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Project not found' });
    if (existing.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted successfully!' });
  } catch (err) { next(err); }
};

// ── LIKE PROJECT ──────────────────────────────────────────────────────────────
const likeProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: { likes: { increment: 1 } },
    });
    res.json({ likes: updated.likes });
  } catch (err) { next(err); }
};

// ── ADD COMMENT ───────────────────────────────────────────────────────────────
const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const comment = await prisma.projectComment.create({
      data: {
        content,
        projectId: req.params.id,
        authorId: req.user.id,
      },
      include: { author: { select: { id: true, name: true, username: true, avatar: true } } },
    });

    res.status(201).json({ comment });
  } catch (err) { next(err); }
};

// ── GET USER PROJECTS ─────────────────────────────────────────────────────────
const getUserProjects = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const projects = await prisma.project.findMany({
      where: {
        authorId: user.id,
        status: 'PUBLISHED',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        tags: { include: { tag: true } },
        ipCertificate: { select: { id: true, issuedAt: true } },
        _count: { select: { comments: true } },
      },
    });
    res.json({ projects });
  } catch (err) { next(err); }
};

module.exports = {
  getProjects,
  getProject,
  getMyProjects,
  createProject,
  updateProject,
  deleteProject,
  likeProject,
  addComment,
  getUserProjects,
};