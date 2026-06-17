import mongoose from 'mongoose';

const FORMATIONS = ['4-4-2', '4-3-3', '3-5-2'];
const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];

const playerSlotSchema = new mongoose.Schema(
  {
    apiPlayerId: { type: Number, required: true },
    name: { type: String, required: true },
    position: { type: String, enum: POSITIONS, required: true },
    teamId: { type: Number },
    teamName: { type: String },
    photo: { type: String },
    isCaptain: { type: Boolean, default: false },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    formation: {
      type: String,
      enum: FORMATIONS,
      default: '4-4-2',
    },
    players: {
      type: [playerSlotSchema],
      validate: {
        validator(players) {
          if (players.length !== 11) return false;
          const ids = players.map((p) => p.apiPlayerId);
          return new Set(ids).size === ids.length;
        },
        message: 'Team must have exactly 11 unique players',
      },
    },
    leagueRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'League',
    },
  },
  { timestamps: true }
);

teamSchema.pre('validate', function validateFormation() {
  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const player of this.players) {
    counts[player.position] += 1;
  }

  const requirements = {
    '4-4-2': { GK: 1, DEF: 4, MID: 4, FWD: 2 },
    '4-3-3': { GK: 1, DEF: 4, MID: 3, FWD: 3 },
    '3-5-2': { GK: 1, DEF: 3, MID: 5, FWD: 2 },
  };

  const required = requirements[this.formation];
  if (!required) return;

  for (const [pos, count] of Object.entries(required)) {
    if (counts[pos] !== count) {
      this.invalidate('players', `Formation ${this.formation} requires ${count} ${pos}, got ${counts[pos]}`);
    }
  }

  const captains = this.players.filter((p) => p.isCaptain);
  if (captains.length !== 1) {
    this.invalidate('players', 'Exactly one captain is required');
  }
});

export const Team = mongoose.model('Team', teamSchema);
export { FORMATIONS, POSITIONS };
