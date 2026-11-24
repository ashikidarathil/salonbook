import mongoose, { Schema, Types, type Model } from 'mongoose';
import { uniqueSlug } from '../common/utils/slug.util';
import { CategoryStatus } from './category.model';

export type ServiceStatus = 'ACTIVE' | 'INACTIVE';

/** One "What's included" line: a short title with an optional description. */
export interface IncludedItem {
  title: string;
  description?: string;
}

/** Older services stored plain strings; read both shapes as items. */
export const toIncludedItems = (raw: unknown): IncludedItem[] =>
  (Array.isArray(raw) ? raw : [])
    .map((item): IncludedItem | null => {
      if (typeof item === 'string') {
        // Old lines were sometimes written as "Title: detail"
        const cut = item.indexOf(':');
        return cut === -1
          ? { title: item.trim(), description: '' }
          : { title: item.slice(0, cut).trim(), description: item.slice(cut + 1).trim() };
      }
      if (item && typeof item === 'object' && 'title' in item) {
        const { title, description } = item as { title?: unknown; description?: unknown };
        return {
          title: String(title ?? '').trim(),
          description: typeof description === 'string' ? description.trim() : '',
        };
      }
      return null;
    })
    .filter((item): item is IncludedItem => !!item && item.title.length > 0);

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
  whatIncluded?: IncludedItem[];
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
  whatIncluded?: IncludedItem[];
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
    // Mixed so services saved before descriptions existed (plain strings) still load
    whatIncluded: {
      type: [Schema.Types.Mixed],
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
