import type { Model } from 'mongoose';
import { BranchModel } from '../models/branch.model';
import { ServiceModel } from '../models/service.model';
import { StylistModel } from '../models/stylist.model';
import { UserModel } from '../models/user.model';
import { uniqueSlug } from '../common/utils/slug.util';

const missing = { $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] };

async function fill<T>(
  model: Model<T>,
  nameOf: (doc: { _id: unknown; name?: string; userId?: unknown }) => Promise<string | undefined>,
): Promise<number> {
  const docs = await model
    .find(missing as never)
    .select('_id name userId')
    .lean<{ _id: unknown; name?: string; userId?: unknown }[]>();
  let count = 0;
  for (const doc of docs) {
    const name = await nameOf(doc);
    if (!name) continue;
    const slug = await uniqueSlug(model, name, doc._id as never);
    await model.updateOne({ _id: doc._id } as never, { $set: { slug } } as never);
    count++;
  }
  return count;
}

/** Gives every branch, service and stylist without a slug one (idempotent). */
export async function ensureSlugs(): Promise<{
  branches: number;
  services: number;
  stylists: number;
}> {
  const branches = await fill(BranchModel, async (d) => d.name);
  const services = await fill(ServiceModel, async (d) => d.name);
  const stylists = await fill(StylistModel, async (d) => {
    const user = await UserModel.findById(d.userId).select('name').lean<{ name?: string }>();
    return user?.name;
  });
  return { branches, services, stylists };
}
