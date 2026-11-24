import { z } from 'zod';
import { SlugSchema } from '../../../common/dto/slug.schema';

const IncludedItemSchema = z
  .object({
    title: z.string().trim().min(1, 'Each included item needs a title').max(60),
    description: z.string().trim().max(300).optional(),
  })
  .strict();

export const CreateServiceSchema = z
  .object({
    name: z.string().min(1, 'Service name is required'),
    description: z.string().optional(),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
    imageUrl: z.string().url('Invalid image URL').optional(),
    whatIncluded: z.array(IncludedItemSchema).max(20).optional(),
    slug: SlugSchema.optional(),
  })
  .strict();

export const UpdateServiceSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    imageUrl: z.string().url('Invalid image URL').optional(),
    categoryId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID')
      .optional(),
    whatIncluded: z.array(IncludedItemSchema).max(20).optional(),
    slug: SlugSchema.optional(),
  })
  .strict();

export const ServicePaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
