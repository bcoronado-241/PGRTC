import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../utils/errors';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: ZodType, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => {
        const field = issue.path.join('.') || part;
        return `${field}: ${issue.message}`;
      });
      next(new ValidationError('Invalid request data', details));
      return;
    }

    req[part] = result.data as never;
    next();
  };
}
