import type { Request, Response } from 'express';
import * as supplyService from '../services/supply.service';
import { parseId, parseOptionalString } from '../utils/params';
import { parsePagination } from '../utils/pagination';

export async function list(req: Request, res: Response): Promise<void> {
  const search = parseOptionalString(req.query.search);
  const pagination = parsePagination(req.query);
  const result = await supplyService.list({ search, pagination });
  res.status(200).json(result);
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const supply = await supplyService.getById(id);
  res.status(200).json(supply);
}

export async function create(req: Request, res: Response): Promise<void> {
  const supply = await supplyService.create(req.body);
  res.status(201).json(supply);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const supply = await supplyService.update(id, req.body);
  res.status(200).json(supply);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  await supplyService.remove(id);
  res.status(204).send();
}
