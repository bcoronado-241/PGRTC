export type StatusLevel = 'red' | 'yellow' | 'green';

export const STATUS_LEVELS: readonly StatusLevel[] = ['red', 'yellow', 'green'];

const STATUS_RANK: Record<StatusLevel, number> = {
  red: 3,
  yellow: 2,
  green: 1,
};

export function isStatusLevel(value: unknown): value is StatusLevel {
  return typeof value === 'string' && (STATUS_LEVELS as readonly string[]).includes(value);
}

/**
 * Traffic-light rule:
 *   quantity <  min_threshold        -> red
 *   quantity <  min_threshold * 1.5  -> yellow
 *   otherwise                        -> green
 * Boundaries are strict: exactly at the threshold is *not* red.
 */
export function calculateInventoryStatus(quantity: number, minThreshold: number): StatusLevel {
  if (quantity < minThreshold) {
    return 'red';
  }
  if (quantity < minThreshold * 1.5) {
    return 'yellow';
  }
  return 'green';
}

export function worstStatus(statuses: StatusLevel[]): StatusLevel {
  if (statuses.length === 0) {
    return 'green';
  }
  return statuses.reduce<StatusLevel>((worst, current) => {
    return STATUS_RANK[current] > STATUS_RANK[worst] ? current : worst;
  }, 'green');
}
