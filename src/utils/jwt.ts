import jwt, { SignOptions } from 'jsonwebtoken';
import { getEnv } from '../config/env';
import type { AuthUser, UserRole } from '../types';

interface TokenPayload {
  id: number;
  email: string;
  role: UserRole;
}

export function signToken(user: AuthUser): string {
  const { JWT_SECRET } = getEnv();
  const options: SignOptions = { expiresIn: '8h' };
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, options);
}

export function verifyToken(token: string): AuthUser {
  const { JWT_SECRET } = getEnv();
  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }

  const payload = decoded as Partial<TokenPayload>;
  if (
    typeof payload.id !== 'number' ||
    typeof payload.email !== 'string' ||
    (payload.role !== 'admin' && payload.role !== 'rescuer')
  ) {
    throw new Error('Invalid token payload');
  }

  return { id: payload.id, email: payload.email, role: payload.role };
}
