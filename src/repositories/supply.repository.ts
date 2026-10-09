import { getPool } from '../config/database';
import type { PaginatedResult, Pagination, Supply } from '../types';
import type { Queryable } from './queryable';

interface SupplyRow {
  id: number;
  supply_name: string;
  unit: string;
  created_at: Date;
}

interface SupplyFilters {
  search?: string;
  pagination: Pagination;
}

export async function listSupplies(
  filters: SupplyFilters,
  db: Queryable = getPool(),
): Promise<PaginatedResult<Supply>> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`supply_name ILIKE $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM supplies ${where}`,
    values,
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  const { page, limit, offset } = filters.pagination;
  const dataValues = [...values, limit, offset];
  const { rows } = await db.query<SupplyRow>(
    `SELECT * FROM supplies ${where}
     ORDER BY id ASC
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

export async function findSupplyById(id: number, db: Queryable = getPool()): Promise<Supply | null> {
  const { rows } = await db.query<SupplyRow>('SELECT * FROM supplies WHERE id = $1 LIMIT 1', [id]);
  return rows[0] ?? null;
}

export async function findSupplyByName(
  name: string,
  db: Queryable = getPool(),
): Promise<Supply | null> {
  const { rows } = await db.query<SupplyRow>('SELECT * FROM supplies WHERE supply_name = $1 LIMIT 1', [
    name,
  ]);
  return rows[0] ?? null;
}

export async function createSupply(
  data: { supply_name: string; unit: string },
  db: Queryable = getPool(),
): Promise<Supply> {
  const { rows } = await db.query<SupplyRow>(
    `INSERT INTO supplies (supply_name, unit)
     VALUES ($1, $2)
     RETURNING *`,
    [data.supply_name, data.unit],
  );
  const row = rows[0];
  if (!row) {
    throw new Error('Failed to create supply');
  }
  return row;
}

export async function updateSupply(
  id: number,
  data: { supply_name: string; unit: string },
  db: Queryable = getPool(),
): Promise<Supply | null> {
  const { rows } = await db.query<SupplyRow>(
    `UPDATE supplies SET supply_name = $1, unit = $2
     WHERE id = $3
     RETURNING *`,
    [data.supply_name, data.unit, id],
  );
  return rows[0] ?? null;
}

export async function deleteSupply(id: number, db: Queryable = getPool()): Promise<boolean> {
  const result = await db.query('DELETE FROM supplies WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
