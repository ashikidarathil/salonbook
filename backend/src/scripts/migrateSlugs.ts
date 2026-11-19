/**
 * Adds readable URL slugs to existing branches, services and stylists. Safe to re-run.
 *
 *   MONGODB_URI='mongodb+srv://.../salonbook_prod?...' MIGRATE_CONFIRM=salonbook_prod \
 *   npm run migrate:slugs
 */
import mongoose from 'mongoose';
import { ensureSlugs } from './ensureSlugs';

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  await mongoose.connect(uri);
  const dbName = mongoose.connection.db?.databaseName;
  if (process.env.MIGRATE_CONFIRM !== dbName) {
    throw new Error(`Refusing to migrate "${dbName}". Set MIGRATE_CONFIRM=${dbName} to confirm.`);
  }
  await Promise.all([
    mongoose.model('Branch').createIndexes(),
    mongoose.model('Service').createIndexes(),
    mongoose.model('Stylist').createIndexes(),
  ]);
  const added = await ensureSlugs();
  console.log(
    `Slugs added in "${dbName}": ${added.branches} branches, ${added.services} services, ${added.stylists} stylists`,
  );
}

main()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
