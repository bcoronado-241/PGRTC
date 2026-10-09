import { getPool } from '../config/database';
import type { Inventory, PaginatedResult, Pagination, StatusLevel } from '../types';
import type { Queryable } from './queryable';

interface InventoryRow {
  id: number;
  center_id: number;
  supply_id: number;
  quantity: number;
  min_threshold: number;
  status: StatusLevel;
  updated_at: Date;
}

function mapInventory(row: InventoryRow): Inventory {
  return {
    id: row.id,
    center_id: row.center_id,
    supply_id: row.supply_id,
    quantity: row.quantity,
    min_threshold: row.min_threshold,
    status: row.status,
    updated_at: row.updated_at,
  };
}

interface InventoryFilters {
  center_id?: number;
  supply_id?: number;
  status?: StatusLevel;
  pagination: Pagination;
}

export async function listInventory(
  filters: InventoryFilters,
  db: Queryable = getPool(),
): Promise<PaginatedResult<Inventory>> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.center_id !== undefined) {
    values.push(filters.center_id);
    conditions.push(`center_id = $${values.length}`);
  }
  if (filters.supply_id !== undefined) {
    values.push(filters.supply_id);
    conditions.push(`supply_id = $${values.length}`);
  }
  if (filters.status !== undefined) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM inventory ${where}`,
    values,
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  const { page, limit, offset } = filters.pagination;
  const dataValues = [...values, limit, offset];
  const { rows } = await db.query<InventoryRow>(
    `SELECT * FROM inventory ${where}
     ORDER BY id ASC
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues,
  );

  return {
    data: rows.map(mapInventory),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function findInventoryById(
  id: number,
  db: Queryable = getPool(),
): Promise<Inventory | null> {
  const { rows } = await db.query<InventoryRow>(
    'SELECT * FROM inventory WHERE id = $1 LIMIT 1',
    [id],
  );
  const row = rows[0];
  return row ? mapInventory(row) : null;
}

export async function findByCenterAndSupply(
  centerId: number,
  supplyId: number,
  db: Queryable = getPool(),
): Promise<Inventory | null> {
  const { rows } = await db.query<InventoryRow>(
    'SELECT * FROM inventory WHERE center_id = $1 AND supply_id = $2 LIMIT 1',
    [centerId, supplyId],
  );
  const row = rows[0];
  return row ? mapInventory(row) : null;
}

export async function lockByCenterAndSupply(
  centerId: number,
  supplyId: number,
  db: Queryable,
): Promise<Inventory | null> {
  const { rows } = await db.query<InventoryRow>(
    'SELECT * FROM inventory WHERE center_id = $1 AND supply_id = $2 FOR UPDATE',
    [centerId, supplyId],
  );
  const row = rows[0];
  return row ? mapInventory(row) : null;
}

export async function createInventory(
  data: {
    center_id: number;
    supply_id: number;
    quantity: number;
    min_threshold: number;
    status: StatusLevel;
  },
  db: Queryable = getPool(),
): Promise<Inventory> {
  const { rows } = await db.query<InventoryRow>(
    `INSERT INTO inventory (center_id, supply_id, quantity, min_threshold, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.center_id, data.supply_id, data.quantity, data.min_threshold, data.status],
  );
  const row = rows[0];
  if (!row) {
    throw new Error('Failed to create inventory');
  }
  return mapInventory(row);
}

export async function updateInventory(
  id: number,
  data: { quantity: number; min_threshold: number; status: StatusLevel },
  db: Queryable = getPool(),
): Promise<Inventory | null> {
  const { rows } = await db.query<InventoryRow>(
    `UPDATE inventory
     SET quantity = $1,
         min_threshold = $2,
         status = $3,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [data.quantity, data.min_threshold, data.status, id],
  );
  const row = rows[0];
  return row ? mapInventory(row) : null;
}

export async function adjustInventoryQuantity(
  id: number,
  quantity: number,
  status: StatusLevel,
  db: Queryable = getPool(),
): Promise<Inventory | null> {
  const { rows } = await db.query<InventoryRow>(
    `UPDATE inventory
     SET quantity = $1,
         status = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [quantity, status, id],
  );
  const row = rows[0];
  return row ? mapInventory(row) : null;
}

export async function deleteInventory(id: number, db: Queryable = getPool()): Promise<boolean> {
  const result = await db.query('DELETE FROM inventory WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getStatusesByCenter(
  centerId: number,
  db: Queryable = getPool(),
): Promise<StatusLevel[]> {
  const { rows } = await db.query<{ status: StatusLevel }>(
    'SELECT status FROM inventory WHERE center_id = $1',
    [centerId],
  );
  return rows.map((row) => row.status);
}
