// Promote (or demote) a user by email. Run from the backend directory:
//   node scripts/make-admin.mjs someone@example.com          -> admin
//   node scripts/make-admin.mjs someone@example.com user     -> back to user
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const email = process.argv[2];
const role = process.argv[3] ?? 'admin';

if (!email || !['admin', 'user'].includes(role)) {
  console.error('Usage: node scripts/make-admin.mjs <email> [admin|user]');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const result = await mongoose.connection
  .collection('users')
  .updateOne({ email: email.toLowerCase() }, { $set: { role } });

if (result.matchedCount === 0) {
  console.error(`No user found with email ${email}`);
} else {
  console.log(`${email} is now: ${role}`);
}
await mongoose.disconnect();
