/**
 * Gives every service without a page photo the same picture as its card photo,
 * so admins can re-crop it later. Only fills empty page photos. Safe to re-run.
 *
 *   MONGODB_URI='mongodb+srv://.../salonbook_prod?...' MIGRATE_CONFIRM=salonbook_prod \
 *   npm run migrate:page-photos
 */
import mongoose from 'mongoose';
import { ServiceModel } from '../models/service.model';

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  await mongoose.connect(uri);
  const dbName = mongoose.connection.db?.databaseName;
  if (process.env.MIGRATE_CONFIRM !== dbName) {
    throw new Error(`Refusing to migrate "${dbName}". Set MIGRATE_CONFIRM=${dbName} to confirm.`);
  }

  const result = await ServiceModel.updateMany(
    {
      imageUrl: { $nin: [null, ''] },
      $or: [
        { detailImageUrl: null },
        { detailImageUrl: '' },
        { detailImageUrl: { $exists: false } },
      ],
    },
    [{ $set: { detailImageUrl: '$imageUrl' } }],
    { updatePipeline: true },
  );
  console.log(`Page photos copied in "${dbName}": ${result.modifiedCount} services`);
}

main()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
