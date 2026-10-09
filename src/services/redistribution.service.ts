import { getPool } from '../config/database';
import * as centerRepository from '../repositories/center.repository';
import * as inventoryRepository from '../repositories/inventory.repository';
import * as redistributionRepository from '../repositories/redistribution.repository';
import * as supplyRepository from '../repositories/supply.repository';
import type { PaginatedResult, Pagination, RedistributionRequest, RequestStatus } from '../types';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { calculateInventoryStatus } from '../utils/status';
import { maybeCreateAlert, recalculateCenterStatus } from './inventory.service';

interface ListRequestParams {
  status?: RequestStatus;
  pagination: Pagination;
}

interface CreateRequestInput {
  source_center_id: number;
  target_center_id: number;
  supply_id: number;
  quantity: number;
}

export async function list(params: ListRequestParams): Promise<PaginatedResult<RedistributionRequest>> {
  return redistributionRepository.listRequests(params);
}

export async function getById(id: number): Promise<RedistributionRequest> {
  const request = await redistributionRepository.findRequestById(id);
  if (!request) {
    throw new NotFoundError('Redistribution request not found');
  }
  return request;
}

export async function create(
  input: CreateRequestInput,
  requestedBy: number,
): Promise<RedistributionRequest> {
  if (input.source_center_id === input.target_center_id) {
    throw new BadRequestError('Source and target centers must be different');
  }

  const [source, target, supply] = await Promise.all([
    centerRepository.findCenterById(input.source_center_id),
    centerRepository.findCenterById(input.target_center_id),
    supplyRepository.findSupplyById(input.supply_id),
  ]);

  if (!source) {
    throw new NotFoundError('Source center not found');
  }
  if (!target) {
    throw new NotFoundError('Target center not found');
  }
  if (!supply) {
    throw new NotFoundError('Supply not found');
  }

  const sourceInventory = await inventoryRepository.findByCenterAndSupply(
    input.source_center_id,
    input.supply_id,
  );
  if (!sourceInventory || sourceInventory.quantity < input.quantity) {
    throw new BadRequestError('Source center does not have enough stock for this supply');
  }

  return redistributionRepository.createRequest({ ...input, requested_by: requestedBy });
}

export async function approve(id: number): Promise<RedistributionRequest> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const request = await redistributionRepository.lockRequestById(id, client);
    if (!request) {
      throw new NotFoundError('Redistribution request not found');
    }
    if (request.status !== 'pending') {
      throw new BadRequestError(`Request cannot be approved because it is already ${request.status}`);
    }

    const sourceInventory = await inventoryRepository.lockByCenterAndSupply(
      request.source_center_id,
      request.supply_id,
      client,
    );
    if (!sourceInventory || sourceInventory.quantity < request.quantity) {
      throw new BadRequestError('Source center no longer has enough stock to fulfill the request');
    }

    const sourceNewQuantity = sourceInventory.quantity - request.quantity;
    const sourceNewStatus = calculateInventoryStatus(sourceNewQuantity, sourceInventory.min_threshold);
    await inventoryRepository.adjustInventoryQuantity(
      sourceInventory.id,
      sourceNewQuantity,
      sourceNewStatus,
      client,
    );

    const targetInventory = await inventoryRepository.lockByCenterAndSupply(
      request.target_center_id,
      request.supply_id,
      client,
    );

    let targetNewStatus;
    if (targetInventory) {
      const targetNewQuantity = targetInventory.quantity + request.quantity;
      targetNewStatus = calculateInventoryStatus(targetNewQuantity, targetInventory.min_threshold);
      await inventoryRepository.adjustInventoryQuantity(
        targetInventory.id,
        targetNewQuantity,
        targetNewStatus,
        client,
      );
    } else {
      targetNewStatus = calculateInventoryStatus(request.quantity, sourceInventory.min_threshold);
      await inventoryRepository.createInventory(
        {
          center_id: request.target_center_id,
          supply_id: request.supply_id,
          quantity: request.quantity,
          min_threshold: sourceInventory.min_threshold,
          status: targetNewStatus,
        },
        client,
      );
    }

    await recalculateCenterStatus(request.source_center_id, client);
    await recalculateCenterStatus(request.target_center_id, client);

    await maybeCreateAlert(request.source_center_id, request.supply_id, sourceNewStatus, client);
    await maybeCreateAlert(request.target_center_id, request.supply_id, targetNewStatus, client);

    const completed = await redistributionRepository.resolveRequest(id, 'completed', client);
    if (!completed) {
      throw new NotFoundError('Redistribution request not found');
    }

    await client.query('COMMIT');
    return completed;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function reject(id: number): Promise<RedistributionRequest> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const request = await redistributionRepository.lockRequestById(id, client);
    if (!request) {
      throw new NotFoundError('Redistribution request not found');
    }
    if (request.status !== 'pending') {
      throw new BadRequestError(`Request cannot be rejected because it is already ${request.status}`);
    }

    const rejected = await redistributionRepository.resolveRequest(id, 'rejected', client);
    if (!rejected) {
      throw new NotFoundError('Redistribution request not found');
    }

    await client.query('COMMIT');
    return rejected;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
