import "@douyinfe/semi-ui/lib/es/react19-adapter";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import type { i18n as I18nInstance } from "i18next";

import { queryClient } from "#/runtime/query-client";
import { runtimeI18n, semiLocaleFor } from "#/runtime/i18n";
import type { RuntimeI18nService } from "#/runtime/i18n";
import { RuntimeI18nContext } from "#/runtime/i18n-context";

interface ProvidersProps extends PropsWithChildren {
  i18n?: I18nInstance;
  queryClient?: QueryClient;
  runtimeI18nService?: null | RuntimeI18nService;
}

function SemiLocaleBridge({ children }: PropsWithChildren) {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === "zh-CN" ? "zh-CN" : "en-US";
  return <LocaleProvider locale={semiLocaleFor(locale)}>{children}</LocaleProvider>;
}

export function Providers({
  children,
  i18n = runtimeI18n,
  queryClient: activeQueryClient = queryClient,
  runtimeI18nService = null,
}: ProvidersProps) {
  return (
    <QueryClientProvider client={activeQueryClient}>
      <I18nextProvider i18n={i18n}>
        <RuntimeI18nContext.Provider value={runtimeI18nService}>
          <SemiLocaleBridge>{children}</SemiLocaleBridge>
        </RuntimeI18nContext.Provider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
