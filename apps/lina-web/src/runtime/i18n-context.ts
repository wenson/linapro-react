import { createContext, useContext } from "react";

import type { RuntimeI18nService } from "#/runtime/i18n";

export const RuntimeI18nContext = createContext<RuntimeI18nService | null>(null);

export function useRuntimeI18n(): RuntimeI18nService | null {
  return useContext(RuntimeI18nContext);
}
