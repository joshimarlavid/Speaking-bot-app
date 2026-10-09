import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useRoleFilters } from './useRoleFilters';
import { ROLES } from '../data';
import { getRoleLevel } from '../utils/roleLevel';

describe('useRoleFilters', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRoleFilters());

    expect(result.current.selectedLevelFilter).toBe('all');
    expect(result.current.roleSearchQuery).toBe('');
    expect(result.current.finalFilteredRoles).toHaveLength(
      ROLES.filter((r) => r.id !== 'joshimar_custom').length
    );
  });

  it('should exclude custom role joshimar_custom from finalFilteredRoles', () => {
    const { result } = renderHook(() => useRoleFilters());

    const customRole = result.current.finalFilteredRoles.find(
      (r) => r.id === 'joshimar_custom'
    );
    expect(customRole).toBeUndefined();
  });

  describe('level filtering', () => {
    it('should filter roles for level A1', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setSelectedLevelFilter('A1');
      });

      expect(result.current.selectedLevelFilter).toBe('A1');
      expect(result.current.finalFilteredRoles.length).toBeGreaterThan(0);
      result.current.finalFilteredRoles.forEach((role) => {
        const lvl = getRoleLevel(role.id, role.name);
        expect(['A1', 'A1/A2']).toContain(lvl);
      });
    });

    it('should filter roles for level A2', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setSelectedLevelFilter('A2');
      });

      expect(result.current.selectedLevelFilter).toBe('A2');
      expect(result.current.finalFilteredRoles.length).toBeGreaterThan(0);
      result.current.finalFilteredRoles.forEach((role) => {
        const lvl = getRoleLevel(role.id, role.name);
        expect(['A2', 'A1/A2']).toContain(lvl);
      });
    });

    it('should filter roles for level B1_B2', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setSelectedLevelFilter('B1_B2');
      });

      expect(result.current.selectedLevelFilter).toBe('B1_B2');
      expect(result.current.finalFilteredRoles.length).toBeGreaterThan(0);
      result.current.finalFilteredRoles.forEach((role) => {
        const lvl = getRoleLevel(role.id, role.name);
        expect(['B1', 'B2', 'B1/B2', 'B2/C1']).toContain(lvl);
      });
    });

    it('should filter roles for level C1', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setSelectedLevelFilter('C1');
      });

      expect(result.current.selectedLevelFilter).toBe('C1');
      expect(result.current.finalFilteredRoles.length).toBeGreaterThan(0);
      result.current.finalFilteredRoles.forEach((role) => {
        const lvl = getRoleLevel(role.id, role.name);
        expect(['C1', 'B2/C1']).toContain(lvl);
      });
    });

    it('should return all non-custom roles when level filter is reset to all', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setSelectedLevelFilter('C1');
      });
      expect(result.current.finalFilteredRoles.length).toBeLessThan(
        ROLES.filter((r) => r.id !== 'joshimar_custom').length
      );

      act(() => {
        result.current.setSelectedLevelFilter('all');
      });
      expect(result.current.finalFilteredRoles).toHaveLength(
        ROLES.filter((r) => r.id !== 'joshimar_custom').length
      );
    });
  });

  describe('search query filtering', () => {
    it('should filter roles by query matching name, description, or winCondition (case-insensitive)', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setRoleSearchQuery('INTRODUCE');
      });

      expect(result.current.roleSearchQuery).toBe('INTRODUCE');
      expect(result.current.finalFilteredRoles.length).toBeGreaterThan(0);
      expect(
        result.current.finalFilteredRoles.every((r) => {
          const q = 'introduce';
          return (
            r.name.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            (r.winCondition && r.winCondition.toLowerCase().includes(q))
          );
        })
      ).toBe(true);
    });

    it('should filter roles matching description', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setRoleSearchQuery('classmate');
      });

      expect(result.current.finalFilteredRoles.length).toBeGreaterThan(0);
      expect(
        result.current.finalFilteredRoles.some(
          (r) => r.description.toLowerCase().includes('classmate')
        )
      ).toBe(true);
    });

    it('should filter roles matching winCondition', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setRoleSearchQuery('prescription');
      });

      expect(result.current.finalFilteredRoles.length).toBeGreaterThan(0);
      expect(
        result.current.finalFilteredRoles.some(
          (r) => r.winCondition && r.winCondition.toLowerCase().includes('prescription')
        )
      ).toBe(true);
    });

    it('should return all roles when search query contains only whitespace', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setRoleSearchQuery('   ');
      });

      expect(result.current.finalFilteredRoles).toHaveLength(
        ROLES.filter((r) => r.id !== 'joshimar_custom').length
      );
    });

    it('should return empty array when search query matches nothing', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setRoleSearchQuery('nonexistent_query_xyz_123');
      });

      expect(result.current.finalFilteredRoles).toEqual([]);
    });
  });

  describe('combined level and search query filtering', () => {
    it('should apply both level filter and search query correctly when matching', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setSelectedLevelFilter('A1');
        result.current.setRoleSearchQuery('Introduce');
      });

      expect(result.current.finalFilteredRoles.length).toBeGreaterThan(0);
      result.current.finalFilteredRoles.forEach((role) => {
        const q = 'introduce';
        const matchesQuery =
          role.name.toLowerCase().includes(q) ||
          role.description.toLowerCase().includes(q) ||
          (role.winCondition && role.winCondition.toLowerCase().includes(q));
        expect(matchesQuery).toBe(true);

        const lvl = getRoleLevel(role.id, role.name);
        expect(['A1', 'A1/A2']).toContain(lvl);
      });
    });

    it('should return empty array when level and search query contradict each other', () => {
      const { result } = renderHook(() => useRoleFilters());

      act(() => {
        result.current.setSelectedLevelFilter('A1');
        result.current.setRoleSearchQuery('Salary Negotiation');
      });

      expect(result.current.finalFilteredRoles).toEqual([]);
    });
  });
});
