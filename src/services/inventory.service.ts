import { getPool } from '../config/database';
import * as alertRepository from '../repositories/alert.repository';
import * as centerRepository from '../repositories/center.repository';
import * as inventoryRepository from '../repositories/inventory.repository';
import * as supplyRepository from '../repositories/supply.repository';
import type { Inventory, PaginatedResult, Pagination, StatusLevel } from '../types';
import type { Queryable } from '../repositories/queryable';
import { NotFoundError } from '../utils/errors';
import { calculateInventoryStatus, worstStatus } from '../utils/status';

interface ListInventoryParams {
  center_id?: number;
  supply_id?: number;
  status?: StatusLevel;
  pagination: Pagination;
}

interface CreateInventoryInput {
  center_id: number;
  supply_id: number;
  quantity: number;
  min_threshold: number;
}

interface UpdateInventoryInput {
  quantity: number;
  min_threshold: number;
}

export async function recalculateCenterStatus(
  centerId: number,
  db: Queryable,
): Promise<StatusLevel> {
  const statuses = await inventoryRepository.getStatusesByCenter(centerId, db);
  const status = worstStatus(statuses);
  await centerRepository.updateCenterStatus(centerId, status, db);
  return status;
}

export async function maybeCreateAlert(
  centerId: number,
  supplyId: number,
  status: StatusLevel,
  db: Queryable,
): Promise<void> {
  if (status === 'green') {
    return;
  }

  const [center, supply] = await Promise.all([
    centerRepository.findCenterById(centerId, db),
    supplyRepository.findSupplyById(supplyId, db),
  ]);

  const supplyName = supply?.supply_name ?? `supply #${supplyId}`;
  const centerName = center?.center_name ?? `center #${centerId}`;
  const message = `Inventory of "${supplyName}" at "${centerName}" is at ${status} level`;

  await alertRepository.createAlert(
    {
      center_id: centerId,
      supply_id: supplyId,
      alert_level: status,
      message,
    },
    db,
  );
}

export async function list(params: ListInventoryParams): Promise<PaginatedResult<Inventory>> {
  return inventoryRepository.listInventory(params);
}

export async function getById(id: number): Promise<Inventory> {
  const inventory = await inventoryRepository.findInventoryById(id);
  if (!inventory) {
    throw new NotFoundError('Inventory record not found');
  }
  return inventory;
}

export async function create(input: CreateInventoryInput): Promise<Inventory> {
  const center = await centerRepository.findCenterById(input.center_id);
  if (!center) {
    throw new NotFoundError('Center not found');
  }
  const supply = await supplyRepository.findSupplyById(input.supply_id);
  if (!supply) {
    throw new NotFoundError('Supply not found');
  }

  const status = calculateInventoryStatus(input.quantity, input.min_threshold);
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const created = await inventoryRepository.createInventory(
      { ...input, status },
      client,
    );
    await recalculateCenterStatus(input.center_id, client);
    await maybeCreateAlert(input.center_id, input.supply_id, status, client);
    await client.query('COMMIT');
    return created;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function update(id: number, input: UpdateInventoryInput): Promise<Inventory> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const existing = await inventoryRepository.findInventoryById(id, client);
    if (!existing) {
      throw new NotFoundError('Inventory record not found');
    }

    const status = calculateInventoryStatus(input.quantity, input.min_threshold);
    const updated = await inventoryRepository.updateInventory(
      id,
      { quantity: input.quantity, min_threshold: input.min_threshold, status },
      client,
    );
    if (!updated) {
      throw new NotFoundError('Inventory record not found');
    }

    await recalculateCenterStatus(existing.center_id, client);
    await maybeCreateAlert(existing.center_id, existing.supply_id, status, client);
    await client.query('COMMIT');
    return updated;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function remove(id: number): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const existing = await inventoryRepository.findInventoryById(id, client);
    if (!existing) {
      throw new NotFoundError('Inventory record not found');
    }

    await inventoryRepository.deleteInventory(id, client);
    await recalculateCenterStatus(existing.center_id, client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
