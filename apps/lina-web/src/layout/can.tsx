import type { ReactNode } from "react";

import { useAuthContext } from "#/auth/auth-context";

export interface CanProps {
  children: ReactNode;
  mode?: "all" | "any";
  permission: readonly string[] | string;
  permissions?: readonly string[];
}

export function Can({ children, mode = "all", permission, permissions }: CanProps) {
  const context = useAuthContext();
  const effectivePermissions = permissions ?? context?.user.permissions ?? [];
  const required = typeof permission === "string" ? [permission] : permission;
  const allowed =
    required.length > 0 &&
    (mode === "any"
      ? required.some((item) => effectivePermissions.includes(item))
      : required.every((item) => effectivePermissions.includes(item)));

  return allowed ? children : null;
}
