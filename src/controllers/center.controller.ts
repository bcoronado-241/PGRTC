import type { Request, Response } from 'express';
import * as centerService from '../services/center.service';
import { parseId, parseOptionalString } from '../utils/params';
import { parsePagination } from '../utils/pagination';

export async function list(req: Request, res: Response): Promise<void> {
  const search = parseOptionalString(req.query.search);
  const pagination = parsePagination(req.query);
  const result = await centerService.list({ search, pagination });
  res.status(200).json(result);
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const center = await centerService.getById(id);
  res.status(200).json(center);
}

export async function create(req: Request, res: Response): Promise<void> {
  const center = await centerService.create(req.body);
  res.status(201).json(center);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const center = await centerService.update(id, req.body);
  res.status(200).json(center);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  await centerService.remove(id);
  res.status(204).send();
}
