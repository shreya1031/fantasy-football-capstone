import mongoose from 'mongoose';

const breakdownSchema = new mongoose.Schema(
  {
    apiPlayerId: Number,
    playerName: String,
    event: String,
    points: Number,
    fixtureId: Number,
  },
  { _id: false }
);

const gameweekScoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    league: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'League',
    },
    gameweek: {
      type: Number,
      required: true,
      min: 1,
    },
    season: {
      type: Number,
      required: true,
    },
    points: {
      type: Number,
      required: true,
      default: 0,
    },
    breakdown: [breakdownSchema],
    computedAt: {
      type: Date,
      default: Date.now,
    },
    isFinal: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

gameweekScoreSchema.index({ team: 1, gameweek: 1, season: 1 }, { unique: true });

export const GameweekScore = mongoose.model('GameweekScore', gameweekScoreSchema);
