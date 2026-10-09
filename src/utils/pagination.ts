import type { Pagination } from '../types';

interface PaginationDefaults {
  page: number;
  limit: number;
  maxLimit: number;
}

const DEFAULTS: PaginationDefaults = { page: 1, limit: 10, maxLimit: 100 };

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

export function parsePagination(
  query: { page?: unknown; limit?: unknown },
  defaults: Partial<PaginationDefaults> = {},
): Pagination {
  const config = { ...DEFAULTS, ...defaults };
  const page = toPositiveInt(query.page, config.page);
  const limit = Math.min(toPositiveInt(query.limit, config.limit), config.maxLimit);
  return { page, limit, offset: (page - 1) * limit };
}
