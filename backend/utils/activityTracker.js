const ActivityLog = require('../models/ActivityLog');

// Wraps ActivityLog.log em try/catch - nunca lança exceção
function track(payload) {
  try {
    ActivityLog.log(payload);
  } catch (err) {
    console.error('[ActivityTracker] Failed to log activity:', err.message);
  }
}

// Helpers semânticos para os tipos de ação do sistema
const tracker = {
  reportSubmitted: (userId, reportId, hardwareIds = []) =>
    track({ userId, actionType: 'report_submitted', entityType: 'benchmark', entityId: String(reportId), metadata: JSON.stringify({ hardwareIds }) }),

  reportVoted: (userId, reportId, voteType) =>
    track({ userId, actionType: 'vote_cast', entityType: 'benchmark', entityId: String(reportId), metadata: JSON.stringify({ voteType }) }),

  badgeEarned: (userId, badgeId, badgeName) =>
    track({ userId, actionType: 'badge_earned', entityType: 'badge', entityId: String(badgeId), metadata: JSON.stringify({ badgeName }) }),

  hardwareAdded: (userId, componentId, componentName) =>
    track({ userId, actionType: 'hardware_added', entityType: 'hardware_component', entityId: String(componentId), metadata: JSON.stringify({ componentName }) }),

  userRegistered: (userId) =>
    track({ userId, actionType: 'user_registered', entityType: 'user', entityId: String(userId) }),

  collectionCreated: (userId, collectionId) =>
    track({ userId, actionType: 'collection_created', entityType: 'collection', entityId: String(collectionId) }),
};

module.exports = tracker;
