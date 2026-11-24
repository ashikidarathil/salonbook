import type { IncludedItem } from '../../../models/service.model';
export type ServiceUpdatePayload = {
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  imageUrl?: string;
  categoryId?: string;
  whatIncluded?: IncludedItem[];
  slug?: string;
};
