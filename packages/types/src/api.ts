/** Standard API contracts shared by the API and the web client (SPEC §8). */

/** Standard error envelope returned by every API error response. */
export interface ApiError {
  error: {
    /** Machine-readable code, e.g. "VALIDATION_ERROR", "UNAUTHORIZED". */
    code: string;
    /** Human-readable message (English; UI maps to localized strings). */
    message: string;
    /** Optional per-field validation details. */
    details?: Record<string, string[]>;
    /** Correlation id for tracing/log lookup. */
    requestId?: string;
  };
}

/** Pagination request params (`?page&limit`). */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/** Standard paginated list envelope. */
export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
