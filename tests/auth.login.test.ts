import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/repositories/user.repository', () => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  findPublicById: vi.fn(),
  createUser: vi.fn(),
  updateFullName: vi.fn(),
}));

import * as userRepository from '../src/repositories/user.repository';
import * as authService from '../src/services/auth.service';
import type { User } from '../src/types';
import { UnauthorizedError } from '../src/utils/errors';
import { hashPassword } from '../src/utils/password';

process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';
process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/pgrtc_test';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    full_name: 'Test Rescuer',
    email: 'rescuer@pgrtc.org',
    password: 'hashed',
    role: 'rescuer',
    created_at: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService.login', () => {
  it('returns a token for correct credentials', async () => {
    const hashed = await hashPassword('Secret123!');
    vi.mocked(userRepository.findByEmail).mockResolvedValue(buildUser({ password: hashed }));

    const result = await authService.login({ email: 'rescuer@pgrtc.org', password: 'Secret123!' });

    expect(result.token).toBeTypeOf('string');
    expect(result.user.email).toBe('rescuer@pgrtc.org');
    expect(result.user).not.toHaveProperty('password');
  });

  it('rejects when the password is incorrect', async () => {
    const hashed = await hashPassword('Secret123!');
    vi.mocked(userRepository.findByEmail).mockResolvedValue(buildUser({ password: hashed }));

    await expect(
      authService.login({ email: 'rescuer@pgrtc.org', password: 'WrongPassword!' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects when the email does not exist', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(
      authService.login({ email: 'nobody@pgrtc.org', password: 'Secret123!' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
