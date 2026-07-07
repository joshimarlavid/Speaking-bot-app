import { describe, it, expect } from 'vitest';
import { getRoleLevel } from './roleLevel';

describe('getRoleLevel', () => {
  it('should return level based on roleName with compound levels', () => {
    expect(getRoleLevel('any', 'Beginner A1/A2')).toBe('A1/A2');
    expect(getRoleLevel('any', 'Beginner A1 / A2')).toBe('A1/A2');
    expect(getRoleLevel('any', 'Intermediate B1/B2')).toBe('B1/B2');
    expect(getRoleLevel('any', 'Intermediate B1 / B2')).toBe('B1/B2');
    expect(getRoleLevel('any', 'Advanced B2/C1')).toBe('B2/C1');
    expect(getRoleLevel('any', 'Advanced B2 / C1')).toBe('B2/C1');
  });

  it('should return level based on roleName with single levels', () => {
    expect(getRoleLevel('any', 'Level A1 Beginner')).toBe('A1');
    expect(getRoleLevel('any', 'Level A2 Beginner')).toBe('A2');
    expect(getRoleLevel('any', 'Level B1 Intermediate')).toBe('B1');
    expect(getRoleLevel('any', 'Level B2 Intermediate')).toBe('B2');
    expect(getRoleLevel('any', 'Level C1 Advanced')).toBe('C1');
  });

  it('should handle case insensitivity in roleName', () => {
    expect(getRoleLevel('any', 'level a1')).toBe('A1');
    expect(getRoleLevel('any', 'level b2 / c1')).toBe('B2/C1');
  });

  it('should fallback to roleId map when roleName has no level', () => {
    expect(getRoleLevel('role_vampire_1', 'Vampire Lord')).toBe('C1');
    expect(getRoleLevel('role_vampire_2', 'Vampire Knight')).toBe('C1');
    expect(getRoleLevel('role_vampire_3', 'Vampire Mage')).toBe('B2/C1');
    expect(getRoleLevel('role_vampire_4', 'Vampire Spawn')).toBe('B1');
    expect(getRoleLevel('role_vampire_5', 'Vampire Elite')).toBe('B2');
    expect(getRoleLevel('role_vampire_6', 'Vampire King')).toBe('C1');
  });

  it('should fallback to B1 default if roleName has no level and roleId is unknown', () => {
    expect(getRoleLevel('unknown_role', 'Just a name')).toBe('B1');
    expect(getRoleLevel('', '')).toBe('B1');
  });
});
