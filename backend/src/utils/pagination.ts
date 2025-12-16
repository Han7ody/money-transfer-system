// backend/src/utils/pagination.ts
/**
 * Pagination Utilities
 * Eliminates duplicate pagination logic across controllers
 */

export interface PaginationParams {
  page?: string | number;
  limit?: string | number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Calculate pagination values for database queries
 */
export const calculatePagination = (
  params: PaginationParams,
  defaultLimit: number = 20
): PaginationResult => {
  const page = Math.max(1, parseInt(String(params.page || 1)));
  const limit = Math.max(1, Math.min(100, parseInt(String(params.limit || defaultLimit))));
  const skip = (page - 1) * limit;

  return {
    skip,
    take: limit,
    page,
    limit
  };
};

/**
 * Create pagination metadata for responses
 */
export const createPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit)
});

/**
 * Extract pagination params from query
 */
export const extractPaginationParams = (query: any): PaginationParams => ({
  page: query.page,
  limit: query.limit
});
