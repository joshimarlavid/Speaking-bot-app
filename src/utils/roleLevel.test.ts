import { describe, it, expect } from 'vitest';
import { getRoleLevel } from './roleLevel';

describe('getRoleLevel', () => {
  it('extracts role level from roleName correctly', () => {
    // Tests for specific string inclusions
    expect(getRoleLevel('any_id', 'Beginner A1/A2')).toBe('A1/A2');
    expect(getRoleLevel('any_id', 'Intermediate B1 / B2')).toBe('B1/B2');
    expect(getRoleLevel('any_id', 'Upper B2/C1 Role')).toBe('B2/C1');
    expect(getRoleLevel('any_id', 'A1 user')).toBe('A1');
    expect(getRoleLevel('any_id', 'A2 level')).toBe('A2');
    expect(getRoleLevel('any_id', 'User B1')).toBe('B1');
    expect(getRoleLevel('any_id', 'Level B2')).toBe('B2');
    expect(getRoleLevel('any_id', 'Advanced C1')).toBe('C1');
  });

  it('falls back to dictionary mapping when roleName does not contain level', () => {
    expect(getRoleLevel('role_vampire_1', 'Vampire Lord')).toBe('C1');
    expect(getRoleLevel('role_vampire_2', 'Vampire Knight')).toBe('C1');
    expect(getRoleLevel('role_vampire_3', 'Vampire Mage')).toBe('B2/C1');
    expect(getRoleLevel('role_vampire_4', 'Vampire Spawn')).toBe('B1');
    expect(getRoleLevel('role_vampire_5', 'Vampire Elder')).toBe('B2');
    expect(getRoleLevel('role_vampire_6', 'Vampire King')).toBe('C1');
  });

  it('returns default fallback "B1" when roleName lacks level and roleId is unmapped', () => {
    expect(getRoleLevel('unknown_role', 'Random Name')).toBe('B1');
    expect(getRoleLevel('', 'Empty Role')).toBe('B1');
  });
});
