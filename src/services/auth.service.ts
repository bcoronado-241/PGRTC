import * as userRepository from '../repositories/user.repository';
import type { PublicUser, UserRole } from '../types';
import { ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { signToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';

interface RegisterInput {
  full_name: string;
  email: string;
  password: string;
  role?: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}

function toPublicUser(user: {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: Date;
}): PublicUser {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await userRepository.findByEmail(input.email);
  if (existing) {
    throw new ConflictError('A user with that email already exists');
  }

  const hashed = await hashPassword(input.password);
  const created = await userRepository.createUser({
    full_name: input.full_name,
    email: input.email,
    password: hashed,
    role: input.role ?? 'rescuer',
  });

  const publicUser = toPublicUser(created);
  const token = signToken({ id: publicUser.id, email: publicUser.email, role: publicUser.role });
  return { user: publicUser, token };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await userRepository.findByEmail(input.email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const matches = await comparePassword(input.password, user.password);
  if (!matches) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const publicUser = toPublicUser(user);
  const token = signToken({ id: publicUser.id, email: publicUser.email, role: publicUser.role });
  return { user: publicUser, token };
}

export async function getProfile(userId: number): Promise<PublicUser> {
  const user = await userRepository.findPublicById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}

export async function updateProfile(userId: number, fullName: string): Promise<PublicUser> {
  const updated = await userRepository.updateFullName(userId, fullName);
  if (!updated) {
    throw new NotFoundError('User not found');
  }
  return updated;
}
