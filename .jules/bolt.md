## 2024-03-09 - Component Memoization
**Learning:** Found multiple pure components without React.memo() that would re-render when the parent state changes. Specifically, `src/components/Header.tsx`, `src/components/GothicSkullFlowerFrame.tsx` and `src/components/GrammarExercises.tsx`. These components rely on props or context and are likely to re-render more than necessary.
**Action:** Implementing React.memo() on components like Header to prevent unnecessary re-renders. Measure re-render counts before and after to quantify impact.
