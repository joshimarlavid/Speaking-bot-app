import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRoleFilters } from './useRoleFilters';

// Mock data to ensure predictable tests regardless of real data changes
vi.mock('../data', () => ({
  ROLES: [
    { id: 'role1', name: 'Role 1', description: 'desc 1', winCondition: 'win 1' },
    { id: 'role2', name: 'Role 2', description: 'desc 2', winCondition: 'win 2' },
    { id: 'joshimar_custom', name: 'Joshimar Custom', description: 'custom', winCondition: 'custom win' },
    { id: 'roleA1', name: 'Role A1', description: 'desc A1', winCondition: 'win A1' },
    { id: 'roleA2', name: 'Role A2', description: 'desc A2', winCondition: 'win A2' },
    { id: 'roleB1', name: 'Role B1', description: 'desc B1', winCondition: 'win B1' },
    { id: 'roleC1', name: 'Role C1', description: 'desc C1', winCondition: 'win C1' },
    { id: 'roleA1A2', name: 'Role A1/A2', description: 'desc A1A2', winCondition: 'win A1A2' },
    { id: 'roleB2C1', name: 'Role B2/C1', description: 'desc B2C1', winCondition: 'win B2C1' },
  ],
  TOPICS: []
}));

// Mock roleLevel utility to return specific levels for our test roles
vi.mock('../utils/roleLevel', () => ({
  getRoleLevel: vi.fn((roleId) => {
    const map: Record<string, string> = {
      'role1': 'B1',
      'role2': 'B2',
      'roleA1': 'A1',
      'roleA2': 'A2',
      'roleB1': 'B1',
      'roleC1': 'C1',
      'roleA1A2': 'A1/A2',
      'roleB2C1': 'B2/C1',
    };
    return map[roleId] || 'B1';
  })
}));

describe('useRoleFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default values and filters out joshimar_custom', () => {
    const { result } = renderHook(() => useRoleFilters());

    expect(result.current.selectedLevelFilter).toBe('all');
    expect(result.current.roleSearchQuery).toBe('');

    const filteredRoles = result.current.finalFilteredRoles;
    expect(filteredRoles.length).toBe(8); // Total 9 - 1 (joshimar_custom)
    expect(filteredRoles.find(r => r.id === 'joshimar_custom')).toBeUndefined();
  });

  describe('search query filtering', () => {
    it('filters by role name (case-insensitive)', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setRoleSearchQuery('ROLE 1');
      });

      expect(result.current.finalFilteredRoles.length).toBe(1);
      expect(result.current.finalFilteredRoles[0].id).toBe('role1');
    });

    it('filters by role description (case-insensitive)', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setRoleSearchQuery('DESC 2');
      });

      expect(result.current.finalFilteredRoles.length).toBe(1);
      expect(result.current.finalFilteredRoles[0].id).toBe('role2');
    });

    it('filters by role winCondition (case-insensitive)', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setRoleSearchQuery('WIN A1');
      });

      // Should match roleA1 and roleA1A2 since 'WIN A1' is in 'win A1A2'
      expect(result.current.finalFilteredRoles.length).toBe(2);
      const ids = result.current.finalFilteredRoles.map(r => r.id);
      expect(ids).toContain('roleA1');
      expect(ids).toContain('roleA1A2');
    });

    it('returns all (except custom) when search query is empty or whitespace', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setRoleSearchQuery('   ');
      });

      expect(result.current.finalFilteredRoles.length).toBe(8);
    });
  });

  describe('level filtering', () => {
    it('filters by A1 level (matches A1 and A1/A2)', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setSelectedLevelFilter('A1');
      });

      expect(result.current.finalFilteredRoles.length).toBe(2);
      const ids = result.current.finalFilteredRoles.map(r => r.id);
      expect(ids).toContain('roleA1');
      expect(ids).toContain('roleA1A2');
    });

    it('filters by A2 level (matches A2 and A1/A2)', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setSelectedLevelFilter('A2');
      });

      expect(result.current.finalFilteredRoles.length).toBe(2);
      const ids = result.current.finalFilteredRoles.map(r => r.id);
      expect(ids).toContain('roleA2');
      expect(ids).toContain('roleA1A2');
    });

    it('filters by B1_B2 level (matches B1, B2, B1/B2, B2/C1)', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setSelectedLevelFilter('B1_B2');
      });

      // role1 (B1), role2 (B2), roleB1 (B1), roleB2C1 (B2/C1)
      expect(result.current.finalFilteredRoles.length).toBe(4);
      const ids = result.current.finalFilteredRoles.map(r => r.id);
      expect(ids).toContain('role1');
      expect(ids).toContain('role2');
      expect(ids).toContain('roleB1');
      expect(ids).toContain('roleB2C1');
    });

    it('filters by C1 level (matches C1 and B2/C1)', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setSelectedLevelFilter('C1');
      });

      expect(result.current.finalFilteredRoles.length).toBe(2);
      const ids = result.current.finalFilteredRoles.map(r => r.id);
      expect(ids).toContain('roleC1');
      expect(ids).toContain('roleB2C1');
    });
  });

  describe('combined filtering', () => {
    it('filters by both search query and level filter', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setSelectedLevelFilter('A1');
        result.current.setRoleSearchQuery('A1A2');
      });

      // Should match A1 level and have 'A1A2' in the string
      expect(result.current.finalFilteredRoles.length).toBe(1);
      expect(result.current.finalFilteredRoles[0].id).toBe('roleA1A2');
    });
  });
});
