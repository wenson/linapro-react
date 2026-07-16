import type { PropsWithChildren } from "react";

import {
  WorkbenchRuntimeContext,
  type WorkbenchRuntimeContextValue,
} from "#/app/workbench-runtime-context";

export function WorkbenchRuntimeProvider({
  children,
  value,
}: PropsWithChildren<{ value: WorkbenchRuntimeContextValue }>) {
  return <WorkbenchRuntimeContext.Provider value={value}>{children}</WorkbenchRuntimeContext.Provider>;
}
