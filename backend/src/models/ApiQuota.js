import mongoose from 'mongoose';

// Tracks daily request counts per external provider so a hard budget can be
// enforced even across server restarts (node --watch restarts often in dev).
const apiQuotaSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  date: { type: String, required: true },
  count: { type: Number, default: 0 },
});

apiQuotaSchema.index({ provider: 1, date: 1 }, { unique: true });

export const ApiQuota = mongoose.model('ApiQuota', apiQuotaSchema);
