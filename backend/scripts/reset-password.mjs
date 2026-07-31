// Reset a user's password by email. Run from the backend directory:
//   node scripts/reset-password.mjs someone@example.com NewPassword123
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword || newPassword.length < 8) {
  console.error('Usage: node scripts/reset-password.mjs <email> <new-password (8+ chars)>');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const passwordHash = await bcrypt.hash(newPassword, 12);
const result = await mongoose.connection
  .collection('users')
  .updateOne({ email: email.toLowerCase() }, { $set: { passwordHash } });

if (result.matchedCount === 0) {
  console.error(`No user found with email ${email}`);
} else {
  console.log(`Password updated for ${email}`);
}
await mongoose.disconnect();
