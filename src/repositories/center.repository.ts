import { getPool } from '../config/database';
import type { Center, CenterType, PaginatedResult, Pagination, StatusLevel } from '../types';
import type { Queryable } from './queryable';

interface CenterRow {
  id: number;
  center_name: string;
  type: CenterType;
  latitude: string;
  longitude: string;
  status: StatusLevel;
  created_at: Date;
}

function mapCenter(row: CenterRow): Center {
  return {
    id: row.id,
    center_name: row.center_name,
    type: row.type,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    status: row.status,
    created_at: row.created_at,
  };
}

interface CenterFilters {
  search?: string;
  pagination: Pagination;
}

export async function listCenters(
  filters: CenterFilters,
  db: Queryable = getPool(),
): Promise<PaginatedResult<Center>> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`center_name ILIKE $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM centers ${where}`,
    values,
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  const { page, limit, offset } = filters.pagination;
  const dataValues = [...values, limit, offset];
  const { rows } = await db.query<CenterRow>(
    `SELECT * FROM centers ${where}
     ORDER BY id ASC
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues,
  );

  return {
    data: rows.map(mapCenter),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function findCenterById(id: number, db: Queryable = getPool()): Promise<Center | null> {
  const { rows } = await db.query<CenterRow>('SELECT * FROM centers WHERE id = $1 LIMIT 1', [id]);
  const row = rows[0];
  return row ? mapCenter(row) : null;
}

export async function createCenter(
  data: {
    center_name: string;
    type: CenterType;
    latitude: number;
    longitude: number;
    status?: StatusLevel;
  },
  db: Queryable = getPool(),
): Promise<Center> {
  const { rows } = await db.query<CenterRow>(
    `INSERT INTO centers (center_name, type, latitude, longitude, status)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'green'))
     RETURNING *`,
    [data.center_name, data.type, data.latitude, data.longitude, data.status ?? null],
  );
  const row = rows[0];
  if (!row) {
    throw new Error('Failed to create center');
  }
  return mapCenter(row);
}

export async function updateCenter(
  id: number,
  data: {
    center_name: string;
    type: CenterType;
    latitude: number;
    longitude: number;
    status?: StatusLevel;
  },
  db: Queryable = getPool(),
): Promise<Center | null> {
  const { rows } = await db.query<CenterRow>(
    `UPDATE centers
     SET center_name = $1,
         type = $2,
         latitude = $3,
         longitude = $4,
         status = COALESCE($5, status)
     WHERE id = $6
     RETURNING *`,
    [data.center_name, data.type, data.latitude, data.longitude, data.status ?? null, id],
  );
  const row = rows[0];
  return row ? mapCenter(row) : null;
}

export async function deleteCenter(id: number, db: Queryable = getPool()): Promise<boolean> {
  const result = await db.query('DELETE FROM centers WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function updateCenterStatus(
  id: number,
  status: StatusLevel,
  db: Queryable = getPool(),
): Promise<void> {
  await db.query('UPDATE centers SET status = $1 WHERE id = $2', [status, id]);
}

export async function countCenterStatuses(
  db: Queryable = getPool(),
): Promise<Record<StatusLevel, number>> {
  const { rows } = await db.query<{ status: StatusLevel; count: string }>(
    'SELECT status, COUNT(*)::int AS count FROM centers GROUP BY status',
  );
  const counters: Record<StatusLevel, number> = { red: 0, yellow: 0, green: 0 };
  for (const row of rows) {
    counters[row.status] = Number(row.count);
  }
  return counters;
}
