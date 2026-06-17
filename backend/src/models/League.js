import mongoose from 'mongoose';

function generateLeagueCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const leagueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      length: 6,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    season: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

leagueSchema.pre('validate', function assignCode() {
  if (!this.code) {
    this.code = generateLeagueCode();
  }
});

export const League = mongoose.model('League', leagueSchema);
