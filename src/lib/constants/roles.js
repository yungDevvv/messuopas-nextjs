// block comment: Centralized role labels (Finnish) and helper to reuse across the app

export const ROLE_LABELS_FI = {
  admin: "Ylläpitäjä",
  customer_admin: "Organisaation ylläpitäjä",
  premium_user: "Premium käyttäjä",
  user: "Käyttäjä",
};

export function getRoleLabelFi(role) {
  // line comment: handle missing/undefined role explicitly
  if (role === undefined || role === null || role === "") return "Ei määritetty";
  return ROLE_LABELS_FI[role] || "Käyttäjä";
}
