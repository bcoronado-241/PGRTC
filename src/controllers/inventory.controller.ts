import type { Request, Response } from 'express';
import * as inventoryService from '../services/inventory.service';
import type { StatusLevel } from '../types';
import { ValidationError } from '../utils/errors';
import { isStatusLevel } from '../utils/status';
import { parseId, parseOptionalInt } from '../utils/params';
import { parsePagination } from '../utils/pagination';

function parseStatusFilter(value: unknown): StatusLevel | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (!isStatusLevel(value)) {
    throw new ValidationError('"status" must be one of: red, yellow, green');
  }
  return value;
}

export async function list(req: Request, res: Response): Promise<void> {
  const centerId = parseOptionalInt(req.query.center_id, 'center_id');
  const supplyId = parseOptionalInt(req.query.supply_id, 'supply_id');
  const status = parseStatusFilter(req.query.status);
  const pagination = parsePagination(req.query);

  const result = await inventoryService.list({
    center_id: centerId,
    supply_id: supplyId,
    status,
    pagination,
  });
  res.status(200).json(result);
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const inventory = await inventoryService.getById(id);
  res.status(200).json(inventory);
}

export async function create(req: Request, res: Response): Promise<void> {
  const inventory = await inventoryService.create(req.body);
  res.status(201).json(inventory);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const inventory = await inventoryService.update(id, req.body);
  res.status(200).json(inventory);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  await inventoryService.remove(id);
  res.status(204).send();
}
