import type { PaginationMetadata } from '@/common/types/pagination.metadata';

export type ServiceStatus = 'ACTIVE' | 'INACTIVE';

export interface Service {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  categoryId: string;
  imageUrl?: string;
  /** Picture for the service page; falls back to imageUrl. */
  detailImageUrl?: string;
  whatIncluded?: IncludedItem[];
  status: ServiceStatus;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceState {
  services: Service[];
  loading: boolean;
  currentService: Service | null;
  imageLoading: boolean;
  error: string | null;
  pagination: PaginationMetadata;
}

export interface ServiceQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  categoryId?: string;
  status?: ServiceStatus;
  isDeleted?: boolean;
}

export interface PaginatedServiceResponse {
  data: Service[];
  pagination: PaginationMetadata;
}

/** card = picture in service lists, detail = picture on the service page. */
export type ServiceImageKind = 'card' | 'detail';

/** One "What's included" line: a short title and its description. */
export interface IncludedItem {
  title: string;
  description?: string;
}
