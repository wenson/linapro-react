import type { ReactNode } from "react";

import { useAuthContext } from "#/auth/auth-context";
import { hasManagementCapability } from "#/plugins/capabilities";
import type { CapabilityProjection, ManagementCapability } from "#/plugins/capabilities";

export interface CapabilityProps {
  capability: ManagementCapability;
  capabilities?: CapabilityProjection;
  children: ReactNode;
}

export function Capability({ capability, capabilities, children }: CapabilityProps) {
  const context = useAuthContext();
  const projection = capabilities ?? context?.capabilities;
  return projection && hasManagementCapability(projection, capability) ? children : null;
}
