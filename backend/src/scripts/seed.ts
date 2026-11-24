/**
 * Fills a database with the data in seedData.ts: categories, services,
 * branches (+ categories and prices per branch), and active stylists with
 * branch assignment, services and a Mon–Sat weekly schedule.
 *
 * Safe to re-run: everything is upserted by name / email.
 * Run `npm run create-admin` against the same database first.
 *
 * Usage (from backend/):
 *   MONGODB_URI='mongodb+srv://.../salonbook_prod?...' \
 *   SEED_STYLIST_PASSWORD='a-strong-password' SEED_CONFIRM=salonbook_prod \
 *   npm run seed
 *
 * SEED_CONFIRM must equal the database name in MONGODB_URI, so the seed
 * can never run against the wrong database by accident.
 */
import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/user.model';
import { CategoryModel } from '../models/category.model';
import { ServiceModel } from '../models/service.model';
import { BranchModel } from '../models/branch.model';
import { BranchCategoryModel } from '../models/branchCategory.model';
import { BranchServiceModel } from '../models/branchService.model';
import { StylistModel } from '../models/stylist.model';
import { StylistBranchModel } from '../models/stylistBranch.model';
import { StylistServiceModel } from '../models/stylistService.model';
import { StylistWeeklyScheduleModel } from '../models/stylistWeeklySchedule.model';
import { UserRole } from '../common/enums/userRole.enum';
import { AuthProvider } from '../common/enums/authProvider.enum';
import {
  branches,
  categories,
  CITY_PRICE_MULTIPLIER,
  services,
  stylists,
  WEEKLY_SHIFT,
  WORKING_DAYS,
  INCLUDED_DESCRIPTIONS,
} from './seedData';
import { serviceImages, stylistImages } from './seedImages';
import { ensureSlugs } from './ensureSlugs';

const upsert = { upsert: true, new: true, setDefaultsOnInsert: true } as const;
// Only (re)place images that are empty or still a seed image, never ones uploaded in the admin panel
const replaceableImage = (field: string) => ({
  $or: [
    { [field]: null },
    { [field]: { $exists: false } },
    { [field]: /^https:\/\/images\.unsplash\.com\// },
  ],
});
const roundTo10 = (n: number) => Math.round(n / 10) * 10;

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  const stylistPassword = process.env.SEED_STYLIST_PASSWORD;
  if (!uri || !stylistPassword) {
    throw new Error('MONGODB_URI and SEED_STYLIST_PASSWORD are required');
  }
  if (stylistPassword.length < 8) {
    throw new Error('SEED_STYLIST_PASSWORD must be at least 8 characters');
  }

  await mongoose.connect(uri);
  const dbName = mongoose.connection.db?.databaseName;
  if (process.env.SEED_CONFIRM !== dbName) {
    throw new Error(`Refusing to seed "${dbName}". Set SEED_CONFIRM=${dbName} to confirm.`);
  }

  const admin = await UserModel.findOne({ role: UserRole.ADMIN }).select('_id email');
  if (!admin) throw new Error('No admin user found. Run `npm run create-admin` first.');
  const adminId = admin._id as Types.ObjectId;
  console.log(`Seeding "${dbName}" as admin ${admin.email}`);

  // Categories
  const categoryIds = new Map<string, Types.ObjectId>();
  for (const c of categories) {
    const doc = await CategoryModel.findOneAndUpdate(
      { name: c.name },
      { $set: { ...c, status: 'ACTIVE', isDeleted: false, deletedAt: null } },
      upsert,
    );
    categoryIds.set(c.name, doc._id as Types.ObjectId);
  }

  // Services
  const serviceIds = new Map<string, Types.ObjectId>();
  for (const s of services) {
    const categoryId = categoryIds.get(s.category);
    if (!categoryId) throw new Error(`Unknown category "${s.category}" for "${s.name}"`);
    const doc = await ServiceModel.findOneAndUpdate(
      { name: s.name },
      {
        $set: {
          name: s.name,
          description: s.description,
          whatIncluded: s.whatIncluded.map((title) => ({
            title,
            description: INCLUDED_DESCRIPTIONS[title] ?? '',
          })),
          categoryId,
          status: 'ACTIVE',
          isDeleted: false,
          deletedAt: null,
        },
      },
      upsert,
    );
    serviceIds.set(s.name, doc._id as Types.ObjectId);

    const image = serviceImages[s.name];
    if (image) {
      await ServiceModel.updateOne(
        { _id: doc._id, ...replaceableImage('imageUrl') },
        { $set: { imageUrl: image.url } },
      );
    }
    // Same picture for the service page until the admin uploads a separate one
    const saved = await ServiceModel.findById(doc._id).select('imageUrl').lean();
    if (saved?.imageUrl) {
      await ServiceModel.updateOne(
        { _id: doc._id, ...replaceableImage('detailImageUrl') },
        { $set: { detailImageUrl: saved.imageUrl } },
      );
    }
  }

  // Branches + every category and service enabled at each branch
  const branchIds = new Map<string, Types.ObjectId>();
  for (const b of branches) {
    const { city, ...fields } = b;
    const branch = await BranchModel.findOneAndUpdate(
      { name: b.name },
      { $set: { ...fields, isDeleted: false } },
      upsert,
    );
    const branchId = branch._id as Types.ObjectId;
    branchIds.set(b.name, branchId);

    for (const categoryId of categoryIds.values()) {
      await BranchCategoryModel.findOneAndUpdate(
        { branchId, categoryId },
        { $set: { isActive: true, updatedBy: adminId } },
        upsert,
      );
    }
    for (const s of services) {
      await BranchServiceModel.findOneAndUpdate(
        { branchId, serviceId: serviceIds.get(s.name) },
        {
          $set: {
            price: city ? roundTo10(s.price * CITY_PRICE_MULTIPLIER) : s.price,
            duration: s.duration,
            isActive: true,
            updatedBy: adminId,
          },
        },
        upsert,
      );
    }
  }

  // Stylists: active user + profile, branch, services, weekly schedule
  const hashed = await bcrypt.hash(stylistPassword, 10);
  for (const st of stylists) {
    const branchId = branchIds.get(st.branch);
    if (!branchId) throw new Error(`Unknown branch "${st.branch}" for "${st.name}"`);

    const user = await UserModel.findOneAndUpdate(
      { email: st.email },
      {
        $set: {
          name: st.name,
          email: st.email,
          phone: st.phone,
          password: hashed,
          role: UserRole.STYLIST,
          authProvider: AuthProvider.LOCAL,
          emailVerified: true,
          isActive: true,
          isBlocked: false,
          status: 'ACTIVE',
        },
      },
      upsert,
    );

    const stylist = await StylistModel.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          specialization: st.specialization,
          experience: st.experience,
          position: st.position,
          bio: st.bio,
          status: 'ACTIVE',
        },
      },
      upsert,
    );
    const stylistId = stylist._id as Types.ObjectId;

    const photo = stylistImages[st.name];
    if (photo) {
      await UserModel.updateOne(
        { _id: user._id, ...replaceableImage('profilePicture') },
        { $set: { profilePicture: photo.url } },
      );
      await StylistModel.updateOne(
        { _id: stylistId, ...replaceableImage('profilePicture') },
        { $set: { profilePicture: photo.url } },
      );
    }

    // One active branch per stylist
    await StylistBranchModel.updateMany(
      { stylistId, branchId: { $ne: branchId }, isActive: true },
      { $set: { isActive: false, unassignedAt: new Date() } },
    );
    await StylistBranchModel.findOneAndUpdate(
      { stylistId, branchId },
      { $set: { isActive: true, assignedBy: adminId, unassignedAt: null } },
      upsert,
    );

    for (const s of services.filter((x) => st.categories.includes(x.category))) {
      await StylistServiceModel.findOneAndUpdate(
        { stylistId, serviceId: serviceIds.get(s.name) },
        { $set: { isActive: true, updatedBy: adminId } },
        upsert,
      );
    }

    for (let day = 0; day <= 6; day++) {
      const working = WORKING_DAYS.includes(day);
      await StylistWeeklyScheduleModel.findOneAndUpdate(
        { stylistId, branchId, dayOfWeek: day },
        { $set: { isWorkingDay: working, shifts: working ? [WEEKLY_SHIFT] : [] } },
        upsert,
      );
    }
  }

  // Upserts skip model hooks, so give new records their readable URL slugs here
  await ensureSlugs();

  console.log(
    `Done: ${categories.length} categories, ${services.length} services, ` +
      `${branches.length} branches, ${stylists.length} stylists, ` +
      `${Object.keys(serviceImages).length + Object.keys(stylistImages).length} images`,
  );
}

main()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
