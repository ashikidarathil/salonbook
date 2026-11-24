import type { IncludedItem } from '../../../models/service.model';
export interface ServiceResponseDto {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName?: string;
  imageUrl?: string;
  detailImageUrl?: string;
  whatIncluded?: IncludedItem[];
  status: 'ACTIVE' | 'INACTIVE';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ServicePaginatedResponse {
  data: ServiceResponseDto[];
  pagination: ServicePaginationMetadata;
}
