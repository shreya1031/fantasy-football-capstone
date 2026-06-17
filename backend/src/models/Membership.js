import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema(
  {
    league: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'League',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    teamRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

membershipSchema.index({ league: 1, user: 1 }, { unique: true });

export const Membership = mongoose.model('Membership', membershipSchema);
