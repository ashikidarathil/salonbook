import type { IncludedItem } from '../../../models/service.model';
import type { PaginationQueryDto } from '../../../common/dto/pagination.query.dto';

export interface CreateServiceDto {
  slug?: string;
  name: string;
  description?: string;
  categoryId: string;
  imageUrl?: string;
  whatIncluded?: IncludedItem[];
}

export interface UpdateServiceDto {
  slug?: string;
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  imageUrl?: string;
  categoryId?: string;
  whatIncluded?: IncludedItem[];
}

export interface SoftDeleteServiceDto {
  id: string;
}

export interface RestoreServiceDto {
  id: string;
}

export interface ServicePaginationQueryDto extends PaginationQueryDto {
  categoryId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}
