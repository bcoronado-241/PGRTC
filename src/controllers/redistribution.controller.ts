import type { Request, Response } from 'express';
import * as redistributionService from '../services/redistribution.service';
import type { RequestStatus } from '../types';
import { UnauthorizedError, ValidationError } from '../utils/errors';
import { parseId } from '../utils/params';
import { parsePagination } from '../utils/pagination';

const REQUEST_STATUSES: readonly RequestStatus[] = ['pending', 'approved', 'rejected', 'completed'];

function parseStatusFilter(value: unknown): RequestStatus | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string' || !(REQUEST_STATUSES as readonly string[]).includes(value)) {
    throw new ValidationError(`"status" must be one of: ${REQUEST_STATUSES.join(', ')}`);
  }
  return value as RequestStatus;
}

export async function list(req: Request, res: Response): Promise<void> {
  const status = parseStatusFilter(req.query.status);
  const pagination = parsePagination(req.query);
  const result = await redistributionService.list({ status, pagination });
  res.status(200).json(result);
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const request = await redistributionService.getById(id);
  res.status(200).json(request);
}

export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const request = await redistributionService.create(req.body, req.user.id);
  res.status(201).json(request);
}

export async function approve(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const request = await redistributionService.approve(id);
  res.status(200).json(request);
}

export async function reject(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const request = await redistributionService.reject(id);
  res.status(200).json(request);
}
