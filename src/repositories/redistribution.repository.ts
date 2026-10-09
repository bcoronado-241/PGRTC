import { getPool } from '../config/database';
import type { PaginatedResult, Pagination, RedistributionRequest, RequestStatus } from '../types';
import type { Queryable } from './queryable';

interface RequestRow {
  id: number;
  source_center_id: number;
  target_center_id: number;
  supply_id: number;
  quantity: number;
  status: RequestStatus;
  requested_by: number;
  created_at: Date;
  resolved_at: Date | null;
}

interface RequestFilters {
  status?: RequestStatus;
  pagination: Pagination;
}

export async function listRequests(
  filters: RequestFilters,
  db: Queryable = getPool(),
): Promise<PaginatedResult<RedistributionRequest>> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM redistribution_requests ${where}`,
    values,
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  const { page, limit, offset } = filters.pagination;
  const dataValues = [...values, limit, offset];
  const { rows } = await db.query<RequestRow>(
    `SELECT * FROM redistribution_requests ${where}
     ORDER BY id DESC
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues,
  );

  return {
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function findRequestById(
  id: number,
  db: Queryable = getPool(),
): Promise<RedistributionRequest | null> {
  const { rows } = await db.query<RequestRow>(
    'SELECT * FROM redistribution_requests WHERE id = $1 LIMIT 1',
    [id],
  );
  return rows[0] ?? null;
}

export async function lockRequestById(
  id: number,
  db: Queryable,
): Promise<RedistributionRequest | null> {
  const { rows } = await db.query<RequestRow>(
    'SELECT * FROM redistribution_requests WHERE id = $1 FOR UPDATE',
    [id],
  );
  return rows[0] ?? null;
}

export async function createRequest(
  data: {
    source_center_id: number;
    target_center_id: number;
    supply_id: number;
    quantity: number;
    requested_by: number;
  },
  db: Queryable = getPool(),
): Promise<RedistributionRequest> {
  const { rows } = await db.query<RequestRow>(
    `INSERT INTO redistribution_requests
       (source_center_id, target_center_id, supply_id, quantity, status, requested_by)
     VALUES ($1, $2, $3, $4, 'pending', $5)
     RETURNING *`,
    [data.source_center_id, data.target_center_id, data.supply_id, data.quantity, data.requested_by],
  );
  const row = rows[0];
  if (!row) {
    throw new Error('Failed to create redistribution request');
  }
  return row;
}

export async function resolveRequest(
  id: number,
  status: RequestStatus,
  db: Queryable = getPool(),
): Promise<RedistributionRequest | null> {
  const { rows } = await db.query<RequestRow>(
    `UPDATE redistribution_requests
     SET status = $1, resolved_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [status, id],
  );
  return rows[0] ?? null;
}

export async function countPendingRequests(db: Queryable = getPool()): Promise<number> {
  const { rows } = await db.query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM redistribution_requests WHERE status = 'pending'`,
  );
  return Number(rows[0]?.count ?? 0);
}
