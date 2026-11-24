/**
 * Turns old "What's included" text lines into { title, description } items and
 * fills empty descriptions from INCLUDED_DESCRIPTIONS. Never overwrites a
 * description an admin wrote. Lists titles it had no text for. Safe to re-run.
 *
 *   MONGODB_URI='mongodb+srv://.../salonbook_prod?...' MIGRATE_CONFIRM=salonbook_prod \
 *   npm run migrate:included
 */
import mongoose from 'mongoose';
import { ServiceModel, toIncludedItems } from '../models/service.model';
import { INCLUDED_DESCRIPTIONS } from './seedData';

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  await mongoose.connect(uri);
  const dbName = mongoose.connection.db?.databaseName;
  if (process.env.MIGRATE_CONFIRM !== dbName) {
    throw new Error(`Refusing to migrate "${dbName}". Set MIGRATE_CONFIRM=${dbName} to confirm.`);
  }

  // Match titles without caring about case or extra spaces
  const known = new Map(
    Object.entries(INCLUDED_DESCRIPTIONS).map(([title, text]) => [
      title.toLowerCase().trim(),
      text,
    ]),
  );
  const missing = new Set<string>();
  let changed = 0;

  const services = await ServiceModel.find({ 'whatIncluded.0': { $exists: true } })
    .select('name whatIncluded')
    .lean();
  for (const service of services) {
    const before = JSON.stringify(service.whatIncluded);
    const items = toIncludedItems(service.whatIncluded).map((item) => {
      if (item.description) return item;
      const text = known.get(item.title.toLowerCase());
      if (!text) missing.add(item.title);
      return { ...item, description: text ?? '' };
    });
    if (JSON.stringify(items) === before) continue;
    await ServiceModel.updateOne({ _id: service._id }, { $set: { whatIncluded: items } });
    changed += 1;
  }

  console.log(`Included items updated in "${dbName}": ${changed} of ${services.length} services`);
  if (missing.size) console.log(`No description yet for: ${[...missing].join(', ')}`);
}

main()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
