export const SUPER_ADMIN_ROLE = "super_admin";
export const MANAGEMENT_ROLE = "management";

export type AccessLevel =
  | "team_member"
  | "management"
  | "super_admin";

export function getAccessLevel(
  role: string | null | undefined
): AccessLevel {
  if (role === SUPER_ADMIN_ROLE) {
    return "super_admin";
  }

  if (role === MANAGEMENT_ROLE) {
    return "management";
  }

  return "team_member";
}

export function hasManagementAccess(
  role: string | null | undefined
) {
  return getAccessLevel(role) !== "team_member";
}

export function isSuperAdmin(
  role: string | null | undefined
) {
  return getAccessLevel(role) === "super_admin";
}

export function getDashboardPath(
  role: string | null | undefined
) {
  return getAccessLevel(role) === "team_member"
    ? "/my-workspace"
    : "/management";
}

export function formatRoleLabel(
  role: string | null | undefined
) {
  if (!role) {
    return "Team Member";
  }

  if (role === "super_admin") {
    return "Super Admin";
  }

  if (role === "management") {
    return "Management";
  }

  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}