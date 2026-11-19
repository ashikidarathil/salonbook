import { Schema, model, Document, type Model } from 'mongoose';
import { uniqueSlug } from '../common/utils/slug.util';

export interface BranchDocument extends Document {
  name: string;
  slug?: string;
  address: string;
  phone?: string;
  isDeleted: boolean;
  latitude: number;
  longitude: number;
  defaultBreaks: Array<{
    startTime: string;
    endTime: string;
    description: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
export type IBranch = BranchDocument;

const branchSchema = new Schema<BranchDocument>(
  {
    slug: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    defaultBreaks: {
      type: [
        {
          startTime: String,
          endTime: String,
          description: String,
        },
      ],
      default: [
        { startTime: '13:00', endTime: '14:00', description: 'Lunch Break' },
        { startTime: '16:00', endTime: '16:30', description: 'Tea Break' },
      ],
    },
  },
  {
    timestamps: true,
  },
);

branchSchema.index({ latitude: 1, longitude: 1 });

// Readable URL id ("kochi", "mens-haircut"). Set once from the name and kept stable
// so links don't break on rename; admins can change it explicitly.
branchSchema.pre('validate', async function () {
  if (this.slug) return;
  this.slug = await uniqueSlug(
    this.constructor as Model<BranchDocument>,
    this.name,
    this._id as never,
  );
});

export const BranchModel = model<BranchDocument>('Branch', branchSchema);
