import { getPool } from '../config/database';
import type { PublicUser, User, UserRole } from '../types';
import type { Queryable } from './queryable';

interface UserRow {
  id: number;
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: Date;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    password: row.password,
    role: row.role,
    created_at: row.created_at,
  };
}

export async function findByEmail(email: string, db: Queryable = getPool()): Promise<User | null> {
  const { rows } = await db.query<UserRow>('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  const row = rows[0];
  return row ? mapUser(row) : null;
}

export async function findById(id: number, db: Queryable = getPool()): Promise<User | null> {
  const { rows } = await db.query<UserRow>('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  const row = rows[0];
  return row ? mapUser(row) : null;
}

export async function findPublicById(
  id: number,
  db: Queryable = getPool(),
): Promise<PublicUser | null> {
  const { rows } = await db.query<Omit<UserRow, 'password'>>(
    'SELECT id, full_name, email, role, created_at FROM users WHERE id = $1 LIMIT 1',
    [id],
  );
  return rows[0] ?? null;
}

export async function createUser(
  data: { full_name: string; email: string; password: string; role: UserRole },
  db: Queryable = getPool(),
): Promise<User> {
  const { rows } = await db.query<UserRow>(
    `INSERT INTO users (full_name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.full_name, data.email, data.password, data.role],
  );
  const row = rows[0];
  if (!row) {
    throw new Error('Failed to create user');
  }
  return mapUser(row);
}

export async function updateFullName(
  id: number,
  fullName: string,
  db: Queryable = getPool(),
): Promise<PublicUser | null> {
  const { rows } = await db.query<Omit<UserRow, 'password'>>(
    `UPDATE users SET full_name = $1
     WHERE id = $2
     RETURNING id, full_name, email, role, created_at`,
    [fullName, id],
  );
  return rows[0] ?? null;
}
