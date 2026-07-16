import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { resolveWorkspaceAssetUrl } from "#/runtime/public-config";

export default function ApiDocsPage() {
  const { config } = useWorkbenchRuntime();
  const { i18n, t } = useTranslation();
  const source = useMemo(() => {
    const params = new URLSearchParams({
      api: "/api.json",
      lang: i18n.resolvedLanguage === "zh-CN" ? "zh-CN" : "en-US",
    });
    return resolveWorkspaceAssetUrl(
      `/stoplight/apidocs.html?${params.toString()}`,
      config.workspace.basePath,
    );
  }, [config.workspace.basePath, i18n.resolvedLanguage]);
  return (
    <iframe
      className="api-docs-frame"
      data-testid="api-docs-frame"
      referrerPolicy="no-referrer"
      src={source}
      title={t("pages.about.apiDocsTitle")}
    />
  );
}
