const prisma = require('../config/db');

// ── GET WORKSPACE ─────────────────────────────────────────────────────────────
const getWorkspace = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;

    // Check kama user amejoin challenge
    const entry = await prisma.challengeEntry.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
      include: { challenge: true },
    });
    if (!entry) return res.status(403).json({ error: 'You have not joined this challenge yet' });

    // Get au create workspace — shared workspace kwa challenge
    let workspace = await prisma.challengeWorkspace.findUnique({
      where: { challengeId },
    });
    if (!workspace) {
      workspace = await prisma.challengeWorkspace.create({
        data: { challengeId, config: {} },
      });
    }

    // Get files za user huyu tu
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
    const { code, language, notes } = req.body;

    const workspace = await prisma.challengeWorkspace.upsert({
      where: { challengeId },
      update: { updatedAt: new Date() },
      create: { challengeId, config: {} },
    });

    res.json({ message: 'Saved!', workspace });
  } catch(err) { next(err); }
};

// ── ADD RESOURCE (Company/Admin) ──────────────────────────────────────────────
const addResource = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const { title, type, url, description } = req.body;

    if (!title || !url) return res.status(400).json({ error: 'Jaza title na URL' });

    const resource = await prisma.workspaceResource.create({
      data: { challengeId, title, type: type||'link', url, description },
    });

    // Notify participants
    const entries = await prisma.challengeEntry.findMany({
      where: { challengeId },
      select: { userId: true },
    });

    const challenge = await prisma.challenge.findUnique({ where:{ id:challengeId }, select:{ title:true } });

    await prisma.notification.createMany({
      data: entries.map(e=>({
        userId: e.userId,
        type: 'WORKSPACE_RESOURCE',
        message: `📎 Resource mpya imeongezwa kwenye "${challenge?.title}": ${title}`,
        link: `/challenges/${challengeId}/workspace`,
      })),
      skipDuplicates: true,
    });

    res.status(201).json({ message: 'Resource imeongezwa!', resource });
  } catch(err) { next(err); }
};

// ── DELETE RESOURCE ───────────────────────────────────────────────────────────
const deleteResource = async (req, res, next) => {
  try {
    await prisma.workspaceResource.delete({ where:{ id: req.params.resourceId } });
    res.json({ message: 'Resource imefutwa!' });
  } catch(err) { next(err); }
};

// ── STARTER CODE ──────────────────────────────────────────────────────────────
const getStarterCode = (language) => {
  const templates = {
    javascript: `// 🚀 ASIEP Challenge Workspace
// Andika solution yako hapa

/**
 * Challenge Solution
 * Tarehe: ${new Date().toLocaleDateString()}
 */

function solution() {
  // TODO: Andika code yako hapa
  
  console.log("Hello from ASIEP! 🌍");
}

solution();`,

    python: `# 🚀 ASIEP Challenge Workspace
# Andika solution yako hapa

"""
Challenge Solution
Tarehe: ${new Date().toLocaleDateString()}
"""

def solution():
    # TODO: Andika code yako hapa
    print("Hello from ASIEP! 🌍")

if __name__ == "__main__":
    solution()`,

    html: `<!DOCTYPE html>
<html lang="sw">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASIEP Challenge Solution</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            background: #0F172A;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        h1 { color: #A78BFA; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌍 ASIEP Challenge Solution</h1>
        <p>Andika solution yako hapa...</p>
    </div>
    <script>
        // JavaScript yako hapa
        console.log("Hello from ASIEP!");
    </script>
</body>
</html>`,

    typescript: `// 🚀 ASIEP Challenge Workspace — TypeScript

interface Solution {
  name: string;
  solve(): void;
}

class ChallengeSolution implements Solution {
  name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  solve(): void {
    // TODO: Andika solution yako hapa
    console.log(\`Hello from \${this.name}! 🌍\`);
  }
}

const solution = new ChallengeSolution("ASIEP");
solution.solve();`,

    sql: `-- 🚀 ASIEP Challenge Workspace — SQL

-- Andika queries zako hapa

SELECT 'Hello from ASIEP! 🌍' AS message;

-- TODO: Andika solution yako hapa`,
  };

  return templates[language] || templates.javascript;
};

// ── GET STARTER CODE ──────────────────────────────────────────────────────────
const getStarterCodeRoute = async (req, res, next) => {
  try {
    const { language } = req.params;
    res.json({ code: getStarterCode(language) });
  } catch(err) { next(err); }
};

// ── GET FILES ─────────────────────────────────────────────────────────────────
const getFiles = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;

    const workspace = await prisma.challengeWorkspace.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
      include: { files: { orderBy: { path: 'asc' } } },
    });

    if (!workspace) return res.status(404).json({ error: 'Workspace haipatikani' });

    // Kama hakuna files — tengeneza file ya default
    if (workspace.files.length === 0) {
      const defaultFile = await prisma.workspaceFile.create({
        data: {
          workspaceId: workspace.id,
          name: 'main.js',
          path: '/main.js',
          content: getStarterCode('javascript'),
          language: 'javascript',
          isFolder: false,
        },
      });
      return res.json({ files: [defaultFile] });
    }

    res.json({ files: workspace.files });
  } catch(err) { next(err); }
};

// ── CREATE FILE/FOLDER ────────────────────────────────────────────────────────
const createFile = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const { name, path, isFolder, language } = req.body;
    const userId = req.user.id;

    const workspace = await prisma.challengeWorkspace.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });
    if (!workspace) return res.status(404).json({ error: 'Workspace haipatikani' });

    // Check kama path tayari ipo
    const existing = await prisma.workspaceFile.findUnique({
      where: { workspaceId_path: { workspaceId: workspace.id, path } },
    });
    if (existing) return res.status(409).json({ error: 'Faili au folda hii tayari ipo' });

    const lang = language || getLanguageFromName(name);
    const file = await prisma.workspaceFile.create({
      data: {
        workspaceId: workspace.id,
        name,
        path,
        content: isFolder ? '' : getStarterCode(lang),
        language: lang,
        isFolder: isFolder || false,
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

    res.json({ message: 'Imehifadhiwa!', file });
  } catch(err) { next(err); }
};

// ── RENAME FILE ───────────────────────────────────────────────────────────────
const renameFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { name, path } = req.body;

    const lang = getLanguageFromName(name);
    const file = await prisma.workspaceFile.update({
      where: { id: fileId },
      data: { name, path, language: lang },
    });

    res.json({ message: 'Imebadilishwa!', file });
  } catch(err) { next(err); }
};

// ── DELETE FILE ───────────────────────────────────────────────────────────────
const deleteFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    // Angalia kama ni folder — futa files zake zote pia
    const file = await prisma.workspaceFile.findUnique({ where: { id: fileId } });
    if (!file) return res.status(404).json({ error: 'Faili haipatikani' });

    if (file.isFolder) {
      // Futa files zote ndani ya folder
      await prisma.workspaceFile.deleteMany({
        where: {
          workspaceId: file.workspaceId,
          path: { startsWith: file.path + '/' },
        },
      });
    }

    await prisma.workspaceFile.delete({ where: { id: fileId } });
    res.json({ message: 'Imefutwa!' });
  } catch(err) { next(err); }
};

// ── HELPER — Language from filename ──────────────────────────────────────────
const getLanguageFromName = (name) => {
  const ext = name?.split('.').pop()?.toLowerCase();
  const map = {
    js:'javascript', ts:'typescript', py:'python',
    html:'html', css:'css', json:'json', md:'markdown',
    sql:'sql', jsx:'javascript', tsx:'typescript',
    txt:'plaintext', sh:'shell', yml:'yaml', yaml:'yaml',
    xml:'xml', php:'php', java:'java', cpp:'cpp', c:'c',
  };
  return map[ext] || 'plaintext';
};

module.exports = {
  getWorkspace, saveWorkspace, addResource,
  deleteResource, getStarterCodeRoute,
  getFiles, createFile, saveFile, renameFile, deleteFile,
};