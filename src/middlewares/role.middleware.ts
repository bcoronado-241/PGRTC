import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { UserRole } from '../types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`This action requires one of the roles: ${roles.join(', ')}`));
      return;
    }

    next();
  };
}
