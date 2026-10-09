import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { requireRole } from '../src/middlewares/role.middleware';
import type { AuthUser } from '../src/types';
import { ForbiddenError, UnauthorizedError } from '../src/utils/errors';

function buildReq(user?: AuthUser): Request {
  return { headers: {}, user } as unknown as Request;
}

function buildRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

describe('requireRole', () => {
  it('blocks a rescuer from an admin-only route with a 403 error', () => {
    const next = vi.fn<NextFunction>();
    const middleware = requireRole('admin');

    middleware(
      buildReq({ id: 2, email: 'rescuer@pgrtc.org', role: 'rescuer' }),
      buildRes(),
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(ForbiddenError);
    expect((error as ForbiddenError).statusCode).toBe(403);
  });

  it('allows a user whose role is permitted', () => {
    const next = vi.fn<NextFunction>();
    const middleware = requireRole('admin', 'rescuer');

    middleware(
      buildReq({ id: 1, email: 'admin@pgrtc.org', role: 'admin' }),
      buildRes(),
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]?.[0]).toBeUndefined();
  });

  it('rejects an unauthenticated request with a 401 error', () => {
    const next = vi.fn<NextFunction>();
    const middleware = requireRole('admin');

    middleware(buildReq(undefined), buildRes(), next);

    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(UnauthorizedError);
    expect((next.mock.calls[0]?.[0] as UnauthorizedError).statusCode).toBe(401);
  });
});
