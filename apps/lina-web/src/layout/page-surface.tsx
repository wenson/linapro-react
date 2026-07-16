import type { PropsWithChildren } from "react";

import type { PageSurface as PageSurfaceType } from "#/router/contracts";

export function PageSurface({ children, surface }: PropsWithChildren<{ surface: PageSurfaceType }>) {
  return <div className={`page-surface page-surface-${surface}`}>{children}</div>;
}
