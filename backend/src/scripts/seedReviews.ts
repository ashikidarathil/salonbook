/**
 * Adds demo customers, past COMPLETED bookings and one review per booking
 * (from seedReviewData.ts), then recalculates rating/reviewCount on every
 * stylist and service the same way the app does after a review.
 *
 * Run after `npm run seed` against the same database. Safe to re-run:
 * customers upsert by email, bookings by bookingNumber, reviews by bookingId.
 *
 *   MONGODB_URI='mongodb+srv://.../salonbook_prod?...' SEED_CONFIRM=salonbook_prod \
 *   npm run seed:reviews
 */
import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/user.model';
import { ServiceModel } from '../models/service.model';
import { StylistModel } from '../models/stylist.model';
import { StylistBranchModel } from '../models/stylistBranch.model';
import { BranchServiceModel } from '../models/branchService.model';
import { BookingModel, BookingStatus, PaymentStatus } from '../models/booking.model';
import { ReviewModel } from '../models/review.model';
import { UserRole } from '../common/enums/userRole.enum';
import { AuthProvider } from '../common/enums/authProvider.enum';
import { customers, reviews } from './seedReviewData';

const upsert = { upsert: true, new: true, setDefaultsOnInsert: true } as const;

const addMinutes = (hhmm: string, minutes: number): string => {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const dayStartUtc = (daysAgo: number): Date => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
};

async function recalcRatings(field: 'stylistId' | 'serviceId'): Promise<number> {
  const stats = await ReviewModel.aggregate<{ _id: Types.ObjectId; avg: number; count: number }>([
    { $match: { isDeleted: false } },
    { $group: { _id: `$${field}`, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  for (const s of stats) {
    const update = { $set: { rating: s.avg, reviewCount: s.count } };
    if (field === 'stylistId') await StylistModel.updateOne({ _id: s._id }, update);
    else await ServiceModel.updateOne({ _id: s._id }, update);
  }
  return stats.length;
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(uri);
  const dbName = mongoose.connection.db?.databaseName;
  if (process.env.SEED_CONFIRM !== dbName) {
    throw new Error(`Refusing to seed "${dbName}". Set SEED_CONFIRM=${dbName} to confirm.`);
  }
  console.log(`Seeding reviews into "${dbName}"`);

  // Customers (demo accounts; random password, not meant for login)
  const customerIds = new Map<string, Types.ObjectId>();
  for (const c of customers) {
    const existing = await UserModel.findOne({ email: c.email }).select('_id');
    const user =
      existing ??
      (await UserModel.create({
        name: c.name,
        email: c.email,
        password: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10),
        role: UserRole.USER,
        authProvider: AuthProvider.LOCAL,
        emailVerified: true,
        isActive: true,
        status: 'ACTIVE',
      }));
    customerIds.set(c.name, user._id as Types.ObjectId);
  }

  // Look up stylists by name → stylistId + their active branch
  const stylistUsers = await UserModel.find({ role: UserRole.STYLIST }).select('_id name');
  const stylistByName = new Map<string, { stylistId: Types.ObjectId; branchId: Types.ObjectId }>();
  for (const u of stylistUsers) {
    const stylist = await StylistModel.findOne({ userId: u._id }).select('_id');
    if (!stylist) continue;
    const mapping = await StylistBranchModel.findOne({ stylistId: stylist._id, isActive: true });
    if (!mapping) continue;
    stylistByName.set(u.name, {
      stylistId: stylist._id as Types.ObjectId,
      branchId: mapping.branchId as Types.ObjectId,
    });
  }

  let count = 0;
  for (const [i, r] of reviews.entries()) {
    const customerId = customerIds.get(r.customer);
    const stylist = stylistByName.get(r.stylist);
    const service = await ServiceModel.findOne({ name: r.service }).select('_id');
    if (!customerId) throw new Error(`Unknown customer "${r.customer}"`);
    if (!stylist) throw new Error(`Unknown stylist "${r.stylist}" (run npm run seed first)`);
    if (!service) throw new Error(`Unknown service "${r.service}"`);

    const branchService = await BranchServiceModel.findOne({
      branchId: stylist.branchId,
      serviceId: service._id,
    });
    if (!branchService) throw new Error(`"${r.service}" is not offered at ${r.stylist}'s branch`);

    const date = dayStartUtc(r.daysAgo);
    const endTime = addMinutes(r.startTime, branchService.duration);
    const price = branchService.price;
    const completedAt = new Date(date.getTime() + 13 * 60 * 60 * 1000);

    const booking = await BookingModel.findOneAndUpdate(
      { bookingNumber: `BK-SEED${String(i + 1).padStart(2, '0')}` },
      {
        $set: {
          userId: customerId,
          branchId: stylist.branchId,
          stylistId: stylist.stylistId,
          items: [
            {
              serviceId: service._id,
              stylistId: stylist.stylistId,
              price,
              duration: branchService.duration,
              date,
              startTime: r.startTime,
              endTime,
            },
          ],
          date,
          startTime: r.startTime,
          endTime,
          totalPrice: price,
          discountAmount: 0,
          payableAmount: price,
          advanceAmount: Math.ceil(price * 0.2),
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          completedAt,
        },
      },
      upsert,
    );

    await ReviewModel.findOneAndUpdate(
      { bookingId: booking._id },
      {
        $set: {
          userId: customerId,
          stylistId: stylist.stylistId,
          serviceId: service._id,
          rating: r.rating,
          comment: r.comment,
          isDeleted: false,
        },
        $setOnInsert: { createdAt: new Date(completedAt.getTime() + 2 * 60 * 60 * 1000) },
      },
      { ...upsert, timestamps: false },
    );
    count++;
  }

  const stylistsRated = await recalcRatings('stylistId');
  const servicesRated = await recalcRatings('serviceId');
  console.log(
    `Done: ${customers.length} customers, ${count} completed bookings + reviews, ` +
      `ratings updated for ${stylistsRated} stylists and ${servicesRated} services`,
  );
}

main()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
