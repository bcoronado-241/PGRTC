import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { UnauthorizedError } from '../utils/errors';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  res.status(200).json(result);
}

export async function profile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const result = await authService.getProfile(req.user.id);
  res.status(200).json(result);
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const { full_name } = req.body as { full_name: string };
  const result = await authService.updateProfile(req.user.id, full_name);
  res.status(200).json(result);
}
