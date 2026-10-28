const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: ['Software', 'User', 'System', 'Upload', 'Auth'],
      index: true,
    },
    entityId: {
      type: String,
      trim: true,
      default: null,
    },
    // Contains non-sensitive operational details only
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // Activity logs are immutable audit records
    timestamps: false,
  }
);

// Compound index for querying recent logs by entity
activityLogSchema.index({ entityType: 1, createdAt: -1 });

const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
