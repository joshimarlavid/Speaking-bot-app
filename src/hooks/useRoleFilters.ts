import { useState, useMemo } from 'react';
import { ROLES, TOPICS } from '../data';
import { getRoleLevel } from '../utils/roleLevel';

export const useRoleFilters = () => {
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'all' | 'A1' | 'A2' | 'B1_B2' | 'C1'>('all');
  const [roleSearchQuery, setRoleSearchQuery] = useState("");

  const baseFilteredRoles = useMemo(() => {
    return ROLES.filter(r => r.id !== 'joshimar_custom');
  }, []);

  const finalFilteredRoles = useMemo(() => {
    return baseFilteredRoles.filter(r => {
      const q = roleSearchQuery.toLowerCase();
      const matchesSearch = !roleSearchQuery.trim() ||
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.winCondition && r.winCondition.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const lvl = getRoleLevel(r.id, r.name);

      if (selectedLevelFilter === 'A1' && !['A1', 'A1/A2'].includes(lvl)) return false;
      if (selectedLevelFilter === 'A2' && !['A2', 'A1/A2'].includes(lvl)) return false;
      if (selectedLevelFilter === 'B1_B2' && !['B1', 'B2', 'B1/B2', 'B2/C1'].includes(lvl)) return false;
      if (selectedLevelFilter === 'C1' && !['C1', 'B2/C1'].includes(lvl)) return false;

      return true;
    });
  }, [baseFilteredRoles, roleSearchQuery, selectedLevelFilter]);

  return {
    selectedLevelFilter, setSelectedLevelFilter,
    roleSearchQuery, setRoleSearchQuery,
    finalFilteredRoles
  };
};
