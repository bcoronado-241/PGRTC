import { ValidationError } from './errors';

export function parseId(raw: string | undefined, name = 'id'): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw new ValidationError(`"${name}" must be a positive integer`);
  }
  return id;
}

export function parseOptionalInt(value: unknown, name: string): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new ValidationError(`"${name}" must be an integer`);
  }
  return parsed;
}

export function parseOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
