export interface PaginationQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  startDate?: string;
  endDate?: string;
}

/** Matches the server's shared pagination response */
export interface EscrowPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginatedEscrowResponse {
  data: EscrowResponseDto[];
  pagination: EscrowPagination;
}

export enum EscrowStatus {
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  CANCELLED = 'CANCELLED',
}

export interface EscrowResponseDto {
  id: string;
  bookingId: {
    id: string;
    bookingNumber: string;
    userId?: {
      name: string;
    };
    items?: Array<{
      serviceId: {
        name: string;
      };
    }>;
  };
  stylistId: {
    id: string;
    userId: {
      name: string;
    };
  };
  amount: number;
  status: EscrowStatus;
  releaseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface EscrowState {
  escrows: EscrowResponseDto[];
  pagination: EscrowPagination | null;
  heldBalance: number;
  loading: boolean;
  error: string | null;
}
