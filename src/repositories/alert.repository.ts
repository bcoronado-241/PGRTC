import { getPool } from '../config/database';
import type { Alert, AlertLevel, PaginatedResult, Pagination } from '../types';
import type { Queryable } from './queryable';

interface AlertRow {
  id: number;
  center_id: number;
  supply_id: number;
  alert_level: AlertLevel;
  message: string;
  created_at: Date;
}

export async function createAlert(
  data: { center_id: number; supply_id: number; alert_level: AlertLevel; message: string },
  db: Queryable = getPool(),
): Promise<Alert> {
  const { rows } = await db.query<AlertRow>(
    `INSERT INTO alerts (center_id, supply_id, alert_level, message)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.center_id, data.supply_id, data.alert_level, data.message],
  );
  const row = rows[0];
  if (!row) {
    throw new Error('Failed to create alert');
  }
  return row;
}

export async function listAlerts(
  filters: { pagination: Pagination },
  db: Queryable = getPool(),
): Promise<PaginatedResult<Alert>> {
  const { page, limit, offset } = filters.pagination;

  const countResult = await db.query<{ count: string }>(
    'SELECT COUNT(*)::int AS count FROM alerts',
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  const { rows } = await db.query<AlertRow>(
    'SELECT * FROM alerts ORDER BY id DESC LIMIT $1 OFFSET $2',
    [limit, offset],
  );

  return {
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function countAlertsLast24h(db: Queryable = getPool()): Promise<number> {
  const { rows } = await db.query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM alerts
     WHERE created_at >= NOW() - INTERVAL '24 hours'`,
  );
  return Number(rows[0]?.count ?? 0);
}
