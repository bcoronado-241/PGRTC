import { describe, expect, it } from 'vitest';
import { calculateInventoryStatus, worstStatus } from '../src/utils/status';

describe('calculateInventoryStatus', () => {
  it('returns red when quantity is below the minimum threshold', () => {
    expect(calculateInventoryStatus(9, 10)).toBe('red');
    expect(calculateInventoryStatus(0, 10)).toBe('red');
  });

  it('treats the exact minimum threshold as yellow, not red', () => {
    expect(calculateInventoryStatus(10, 10)).toBe('yellow');
  });

  it('returns yellow when quantity is below 1.5x the threshold', () => {
    expect(calculateInventoryStatus(14, 10)).toBe('yellow');
    expect(calculateInventoryStatus(11, 10)).toBe('yellow');
  });

  it('returns green exactly at 1.5x the threshold', () => {
    expect(calculateInventoryStatus(15, 10)).toBe('green');
  });

  it('returns green when quantity is far above the threshold', () => {
    expect(calculateInventoryStatus(1000, 10)).toBe('green');
  });
});

describe('worstStatus', () => {
  it('returns red when any inventory is red', () => {
    expect(worstStatus(['green', 'yellow', 'red'])).toBe('red');
  });

  it('returns yellow when the worst is yellow', () => {
    expect(worstStatus(['green', 'green', 'yellow'])).toBe('yellow');
  });

  it('returns green when all are green or the list is empty', () => {
    expect(worstStatus(['green', 'green'])).toBe('green');
    expect(worstStatus([])).toBe('green');
  });
});
