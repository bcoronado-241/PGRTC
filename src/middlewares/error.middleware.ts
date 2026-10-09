import type { NextFunction, Request, Response } from 'express';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';

interface PgError {
  code?: string;
}

function isPgError(error: unknown): error is PgError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ValidationError) {
    console.error('[error] ValidationError:', error.message, error.details);
    res.status(error.statusCode).json({ error: error.message, details: error.details });
    return;
  }

  if (error instanceof AppError) {
    if (!error.isOperational || error.statusCode >= 500) {
      console.error('[error]', error);
    } else {
      console.error(`[error] ${error.name}: ${error.message}`);
    }
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (isPgError(error)) {
    console.error('[error] Database error:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'A record with the same unique fields already exists' });
      return;
    }
    if (error.code === '23503') {
      res.status(409).json({ error: 'Operation violates a foreign key constraint' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  console.error('[error] Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
}
