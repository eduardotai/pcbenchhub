const ActivityLog = require('../models/ActivityLog');

function track(payload) {
  try {
    ActivityLog.log(payload);
  } catch (err) {
    console.error('[ActivityTracker] Failed to log activity:', err.message);
  }
}

const tracker = {
  reportSubmitted: (userId, reportId, hardwareIds = []) =>
    track({
      userId,
      actionType: 'report_submitted',
      entityType: 'benchmark',
      entityId: String(reportId),
      metadata: { report_id: String(reportId), hardware_ids: hardwareIds },
    }),

  reportVoted: (userId, reportId, voteType) =>
    track({
      userId,
      actionType: 'vote_cast',
      entityType: 'benchmark',
      entityId: String(reportId),
      metadata: { vote_type: voteType },
    }),

  badgeEarned: (userId, badgeId, badgeName) =>
    track({
      userId,
      actionType: 'badge_earned',
      entityType: 'badge',
      entityId: String(badgeId),
      metadata: { badge_name: badgeName },
    }),

  hardwareAdded: (userId, componentId, componentName) =>
    track({
      userId,
      actionType: 'hardware_added',
      entityType: 'hardware_component',
      entityId: String(componentId),
      metadata: { component_name: componentName },
    }),

  userRegistered: (userId) =>
    track({ userId, actionType: 'user_registered', entityType: 'user', entityId: String(userId) }),

  collectionCreated: (userId, collectionId, collectionName = null) =>
    track({
      userId,
      actionType: 'collection_created',
      entityType: 'collection',
      entityId: String(collectionId),
      metadata: collectionName ? { collection_name: collectionName } : null,
    }),
};

module.exports = tracker;
