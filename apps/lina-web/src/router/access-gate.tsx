import type { PropsWithChildren } from "react";

import { useAuthContext } from "#/auth/auth-context";
import { ForbiddenPage } from "#/features/fallback/status-pages";

export function AccessGate({ children, permission }: PropsWithChildren<{ permission?: string }>) {
  const context = useAuthContext();
  const allowed = !permission || context?.user.permissions.includes(permission) === true;
  return allowed ? children : <ForbiddenPage />;
}
