import mongoose, { Schema, Document, type Model } from 'mongoose';
import { uniqueSlug } from '../common/utils/slug.util';

export interface StylistDocument extends Document {
  userId: mongoose.Types.ObjectId;
  slug?: string;
  specialization: string;
  experience: number;
  rating: number;
  reviewCount: number;
  bio?: string;
  status: 'ACTIVE' | 'INACTIVE';
  position: 'JUNIOR' | 'SENIOR' | 'TRAINEE';
  profilePicture?: string;
  allowChat: boolean;
  earningsBalance: number;
  pendingPayout: number;
  createdAt: Date;
  updatedAt: Date;
}
export type IStylist = StylistDocument;

const StylistSchema = new Schema<StylistDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    slug: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    specialization: { type: String, required: true, trim: true },
    experience: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    bio: { type: String, trim: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'INACTIVE' },
    position: {
      type: String,
      enum: ['JUNIOR', 'SENIOR', 'TRAINEE'],
      default: 'TRAINEE',
    },
    profilePicture: { type: String },
    allowChat: { type: Boolean, default: true },
    earningsBalance: { type: Number, default: 0 },
    pendingPayout: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Readable URL id from the stylist's name ("arjun-menon"). Set once, kept stable.
StylistSchema.pre('validate', async function () {
  if (this.slug || !this.userId) return;
  const user = await mongoose
    .model('User')
    .findById(this.userId)
    .select('name')
    .lean<{ name?: string }>();
  if (!user?.name) return;
  this.slug = await uniqueSlug(
    this.constructor as Model<StylistDocument>,
    user.name,
    this._id as never,
  );
});

export const StylistModel =
  mongoose.models.Stylist || mongoose.model<StylistDocument>('Stylist', StylistSchema);
