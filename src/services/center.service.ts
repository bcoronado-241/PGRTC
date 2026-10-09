import * as centerRepository from '../repositories/center.repository';
import type { Center, CenterType, PaginatedResult, Pagination, StatusLevel } from '../types';
import { NotFoundError } from '../utils/errors';

interface ListCenterParams {
  search?: string;
  pagination: Pagination;
}

interface CenterInput {
  center_name: string;
  type: CenterType;
  latitude: number;
  longitude: number;
  status?: StatusLevel;
}

export async function list(params: ListCenterParams): Promise<PaginatedResult<Center>> {
  return centerRepository.listCenters(params);
}

export async function getById(id: number): Promise<Center> {
  const center = await centerRepository.findCenterById(id);
  if (!center) {
    throw new NotFoundError('Center not found');
  }
  return center;
}

export async function create(input: CenterInput): Promise<Center> {
  return centerRepository.createCenter(input);
}

export async function update(id: number, input: CenterInput): Promise<Center> {
  const updated = await centerRepository.updateCenter(id, input);
  if (!updated) {
    throw new NotFoundError('Center not found');
  }
  return updated;
}

export async function remove(id: number): Promise<void> {
  const deleted = await centerRepository.deleteCenter(id);
  if (!deleted) {
    throw new NotFoundError('Center not found');
  }
}
