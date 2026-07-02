export const getRoleLevel = (roleId: string, roleName: string): string => {
  const nameUpper = roleName.toUpperCase();
  if (nameUpper.includes("A1/A2") || nameUpper.includes("A1 / A2")) return "A1/A2";
  if (nameUpper.includes("B1/B2") || nameUpper.includes("B1 / B2")) return "B1/B2";
  if (nameUpper.includes("B2/C1") || nameUpper.includes("B2 / C1")) return "B2/C1";
  if (nameUpper.includes("A1")) return "A1";
  if (nameUpper.includes("A2")) return "A2";
  if (nameUpper.includes("B1")) return "B1";
  if (nameUpper.includes("B2")) return "B2";
  if (nameUpper.includes("C1")) return "C1";

  const map: Record<string, string> = {
    "role_vampire_1": "C1",
    "role_vampire_2": "C1",
    "role_vampire_3": "B2/C1",
    "role_vampire_4": "B1",
    "role_vampire_5": "B2",
    "role_vampire_6": "C1",
  };
  return map[roleId] || "B1";
};
