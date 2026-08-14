const prisma = require('../config/db');

const getStarterCode = (language) => {
  const templates = {
    javascript: `// 🚀 ASIEP Challenge Workspace\nfunction solution() {\n  console.log("Hello from ASIEP! 🌍");\n}\nsolution();`,
    python: `# 🚀 ASIEP Challenge Workspace\ndef solution():\n    print("Hello from ASIEP! 🌍")\n\nif __name__ == "__main__":\n    solution()`,
    html: `<!DOCTYPE html>\n<html>\n<head><title>ASIEP Solution</title></head>\n<body><h1>🌍 ASIEP Solution</h1></body>\n</html>`,
  };
  return templates[language] || `// ${language} solution\n`;
};

// ── GET WORKSPACE ─────────────────────────────────────────────────────────────
const getWorkspace = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;

    const entry = await prisma.challengeEntry.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
      include: { challenge: true },
    });
    if (!entry) return res.status(403).json({ error: 'You have not joined this challenge yet' });

    let workspace = await prisma.challengeWorkspace.findUnique({
      where: { challengeId },
    });
    if (!workspace) {
      workspace = await prisma.challengeWorkspace.create({
        data: { challengeId, config: {} },
      });
    }

    const resources = await prisma.workspaceResource.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { id: 'asc' },
    });

    res.json({ workspace, challenge: entry.challenge, resources });
  } catch(err) { next(err); }
};

// ── SAVE WORKSPACE ────────────────────────────────────────────────────────────
const saveWorkspace = async (req, res, next) => {
  try {
    const { challengeId } = req.params;

    const workspace = await prisma.challengeWorkspace.upsert({
      where: { challengeId },
      update: { updatedAt: new Date() },
      create: { challengeId, config: {} },
    });

    res.json({ message: 'Saved!', workspace });
  } catch(err) { next(err); }
};

// ── ADD RESOURCE ──────────────────────────────────────────────────────────────
const addResource = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const { title, type, url } = req.body;
    if (!title || !url) return res.status(400).json({ error: 'Title and URL required' });

    const workspace = await prisma.challengeWorkspace.findUnique({
      where: { challengeId },
    });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const resource = await prisma.workspaceResource.create({
      data: { title, type: type || 'LINK', url, workspaceId: workspace.id },
    });

    res.status(201).json({ message: 'Resource added!', resource });
  } catch(err) { next(err); }
};

// ── DELETE RESOURCE ───────────────────────────────────────────────────────────
const deleteResource = async (req, res, next) => {
  try {
    await prisma.workspaceResource.delete({ where: { id: req.params.resourceId } });
    res.json({ message: 'Resource deleted!' });
  } catch(err) { next(err); }
};

// ── GET STARTER CODE ──────────────────────────────────────────────────────────
const getStarterCodeRoute = async (req, res) => {
  const code = getStarterCode(req.params.language);
  res.json({ code });
};

// ── GET FILES ─────────────────────────────────────────────────────────────────
const getFiles = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;

    const workspace = await prisma.challengeWorkspace.findUnique({
      where: { challengeId },
    });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const files = await prisma.workspaceFile.findMany({
      where: { workspaceId: workspace.id, userId },
      orderBy: { name: 'asc' },
    });

    res.json({ files });
  } catch(err) { next(err); }
};

// ── CREATE FILE ───────────────────────────────────────────────────────────────
const createFile = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;
    const { name, path, isFolder, language } = req.body;

    const workspace = await prisma.challengeWorkspace.findUnique({
      where: { challengeId },
    });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const content = isFolder ? '' : getStarterCode(language || 'javascript');

    const file = await prisma.workspaceFile.create({
      data: {
        name,
        path: path || `/${name}`,
        content: content,
        language: language || 'javascript',
        workspaceId: workspace.id,
        userId,
      },
    });

    res.status(201).json({ file });
  } catch(err) { next(err); }
};

// ── SAVE FILE ─────────────────────────────────────────────────────────────────
const saveFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { content } = req.body;

    const file = await prisma.workspaceFile.update({
      where: { id: fileId },
      data: { content, updatedAt: new Date() },
    });

    res.json({ message: 'File saved!', file });
  } catch(err) { next(err); }
};

// ── RENAME FILE ───────────────────────────────────────────────────────────────
const renameFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { name, path } = req.body;

    const file = await prisma.workspaceFile.update({
      where: { id: fileId },
      data: { name, path },
    });

    res.json({ message: 'File renamed!', file });
  } catch(err) { next(err); }
};

// ── DELETE FILE ───────────────────────────────────────────────────────────────
const deleteFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    await prisma.workspaceFile.delete({ where: { id: fileId } });
    res.json({ message: 'File deleted!' });
  } catch(err) { next(err); }
};

module.exports = {
  getWorkspace,
  saveWorkspace,
  addResource,
  deleteResource,
  getStarterCodeRoute,
  getFiles,
  createFile,
  saveFile,
  renameFile,
  deleteFile,
};