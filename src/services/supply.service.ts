import * as supplyRepository from '../repositories/supply.repository';
import type { PaginatedResult, Pagination, Supply } from '../types';
import { ConflictError, NotFoundError } from '../utils/errors';

interface ListSupplyParams {
  search?: string;
  pagination: Pagination;
}

interface SupplyInput {
  supply_name: string;
  unit: string;
}

export async function list(params: ListSupplyParams): Promise<PaginatedResult<Supply>> {
  return supplyRepository.listSupplies(params);
}

export async function getById(id: number): Promise<Supply> {
  const supply = await supplyRepository.findSupplyById(id);
  if (!supply) {
    throw new NotFoundError('Supply not found');
  }
  return supply;
}

export async function create(input: SupplyInput): Promise<Supply> {
  const existing = await supplyRepository.findSupplyByName(input.supply_name);
  if (existing) {
    throw new ConflictError('A supply with that name already exists');
  }
  return supplyRepository.createSupply(input);
}

export async function update(id: number, input: SupplyInput): Promise<Supply> {
  const updated = await supplyRepository.updateSupply(id, input);
  if (!updated) {
    throw new NotFoundError('Supply not found');
  }
  return updated;
}

export async function remove(id: number): Promise<void> {
  const deleted = await supplyRepository.deleteSupply(id);
  if (!deleted) {
    throw new NotFoundError('Supply not found');
  }
}
