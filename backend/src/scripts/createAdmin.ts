/**
 * Creates (or resets) the admin account in the database at MONGODB_URI.
 *
 * Usage (from backend/):
 *   MONGODB_URI='mongodb+srv://...' ADMIN_EMAIL='you@example.com' \
 *   ADMIN_PASSWORD='a-strong-password' ADMIN_NAME='Admin' npm run create-admin
 *
 * Reads only these variables, so it works without the full app .env.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/user.model';
import { UserRole } from '../common/enums/userRole.enum';
import { AuthProvider } from '../common/enums/authProvider.enum';

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'Admin';

  if (!uri || !email || !password) {
    throw new Error('MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }

  await mongoose.connect(uri);

  const hashed = await bcrypt.hash(password, 10);
  const admin = await UserModel.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        email,
        password: hashed,
        role: UserRole.ADMIN,
        authProvider: AuthProvider.LOCAL,
        emailVerified: true,
        isActive: true,
        isBlocked: false,
        status: 'ACTIVE',
      },
    },
    { upsert: true, new: true },
  );

  console.log(`Admin ready: ${admin.email} (${String(admin._id)})`);
}

main()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
