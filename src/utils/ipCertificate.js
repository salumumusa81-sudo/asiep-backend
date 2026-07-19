const crypto = require('crypto');

/**
 * Tengeneza hash ya kipekee ya mradi (IP fingerprint)
 * Inatumika kama ushahidi wa kisheria wa umiliki
 */
const generateContentHash = (data) => {
  const content = JSON.stringify({
    title: data.title,
    description: data.description,
    authorId: data.authorId,
    timestamp: data.createdAt,
  });
  return crypto.createHash('sha256').update(content).digest('hex');
};

/**
 * Tengeneza IP Certificate data
 */
const createCertificateData = (project, user) => {
  const hash = generateContentHash({
    title: project.title,
    description: project.description,
    authorId: user.id,
    createdAt: new Date().toISOString(),
  });

  return {
    contentHash: hash,
    metadata: {
      ownerName: user.name,
      ownerEmail: user.email,
      university: user.university,
      projectTitle: project.title,
      issuedAt: new Date().toISOString(),
      platform: 'ASIEP — African Student Innovation Ecosystem Platform',
    },
  };
};

module.exports = { generateContentHash, createCertificateData };
