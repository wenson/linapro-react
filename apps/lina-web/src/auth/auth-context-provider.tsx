import type { PropsWithChildren } from "react";

import type { AuthenticatedContext } from "#/auth/auth-context";
import { AuthContext } from "#/auth/auth-context";

export function AuthContextProvider({
  children,
  value,
}: PropsWithChildren<{ value: AuthenticatedContext }>) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
