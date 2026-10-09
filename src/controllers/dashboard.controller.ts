import type { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';

export async function getDashboard(_req: Request, res: Response): Promise<void> {
  const summary = await dashboardService.getDashboard();
  res.status(200).json(summary);
}
