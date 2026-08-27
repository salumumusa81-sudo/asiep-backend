const prisma = require('../config/db');

async function clearAll() {
  console.log('🗑️ Clearing all data...');
  try {
    await prisma.collaborationTask.deleteMany();
    await prisma.collaborationMember.deleteMany();
    await prisma.collaboration.deleteMany();
    await prisma.investorInterest.deleteMany();
    await prisma.startupMilestone.deleteMany();
    await prisma.startup.deleteMany();
    await prisma.datasetRating.deleteMany();
    await prisma.datasetAccessRequest.deleteMany();
    await prisma.dataset.deleteMany();
    await prisma.grantApplication.deleteMany();
    await prisma.sponsorGrant.deleteMany();
    await prisma.mentorship.deleteMany();
    await prisma.userBadge.deleteMany();
    await prisma.userPoints.deleteMany();
    await prisma.pointHistory.deleteMany();
    await prisma.discussionReply.deleteMany();
    await prisma.discussionThread.deleteMany();
    await prisma.challengeEntry.deleteMany();
    await prisma.challenge.deleteMany();
    await prisma.workspaceFile.deleteMany();
    await prisma.feedPost.deleteMany();
    await prisma.ipCertificate.deleteMany();
    await prisma.project.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversationParticipant.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.userSkill.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ All data cleared!');
  } catch(err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearAll();