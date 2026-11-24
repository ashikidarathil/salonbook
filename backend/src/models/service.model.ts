import mongoose, { Schema, Types, type Model } from 'mongoose';
import { uniqueSlug } from '../common/utils/slug.util';
import { CategoryStatus } from './category.model';

export type ServiceStatus = 'ACTIVE' | 'INACTIVE';

/** imageUrl is the card picture in lists; detailImageUrl is shown on the service page. */
export type ServiceImageField = 'imageUrl' | 'detailImageUrl';

export interface ServiceDocument extends mongoose.Document {
  name: string;
  slug?: string;
  description?: string;
  categoryId: mongoose.Types.ObjectId;
  imageUrl?: string;
  /** Larger picture for the service page; the card image is used when empty. */
  detailImageUrl?: string;
  whatIncluded?: string[];
  status: ServiceStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  rating: number;
  reviewCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export type ServiceLean = {
  _id: Types.ObjectId;
  name: string;
  slug?: string;
  categoryId?: {
    _id: Types.ObjectId;
    name: string;
    status: CategoryStatus;
    isDeleted: boolean;
  };
  imageUrl?: string;
  detailImageUrl?: string;
  description?: string;
  whatIncluded?: string[];
  status: ServiceStatus;
  isDeleted: boolean;
  createdAt: Date;
  rating: number;
  reviewCount: number;
};

const ServiceSchema = new Schema<ServiceDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    description: { type: String, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    imageUrl: { type: String, default: null },
    detailImageUrl: { type: String, default: null },
    whatIncluded: {
      type: [String],
      default: [],
    },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

ServiceSchema.index(
  { name: 1, categoryId: 1 },
  {
    unique: true,
    collation: { locale: 'en', strength: 2 },
  },
);
ServiceSchema.index({ name: 'text', description: 'text' });

// Readable URL id ("kochi", "mens-haircut"). Set once from the name and kept stable
// so links don't break on rename; admins can change it explicitly.
ServiceSchema.pre('validate', async function () {
  if (this.slug) return;
  this.slug = await uniqueSlug(
    this.constructor as Model<ServiceDocument>,
    this.name,
    this._id as never,
  );
});

export const ServiceModel = mongoose.model<ServiceDocument>('Service', ServiceSchema);
