import Button from "@douyinfe/semi-ui/lib/es/button";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { resolveWorkspaceAssetUrl } from "#/runtime/public-config";

export default function ApiDocsPage() {
  const { apiClient, config } = useWorkbenchRuntime();
  const { i18n, t } = useTranslation();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<"failed" | "loading" | "ready">("loading");
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
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10_000);
    setState("loading");
    void apiClient.requestRaw(`/api.json?lang=${encodeURIComponent(i18n.resolvedLanguage === "zh-CN" ? "zh-CN" : "en-US")}`, {
      cache: "no-store",
      signal: controller.signal,
    }).then((response) => {
      if (!response.ok) throw new Error(`OpenAPI preflight failed with ${response.status}`);
      if (!controller.signal.aborted) setState("ready");
    }).catch(() => {
      if (!controller.signal.aborted) setState("failed");
    }).finally(() => window.clearTimeout(timer));

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [apiClient, attempt, i18n.resolvedLanguage]);

  if (state === "failed") {
    return (
      <section className="api-docs-state" data-testid="api-docs-failed" role="alert">
        <Typography.Title heading={4}>{t("pages.about.apiDocsUnavailableTitle")}</Typography.Title>
        <Typography.Paragraph>{t("pages.about.apiDocsUnavailableDescription")}</Typography.Paragraph>
        <Button onClick={retry} theme="solid" type="primary">{t("fallback.retry")}</Button>
      </section>
    );
  }

  if (state === "loading") {
    return (
      <section aria-busy="true" className="api-docs-state" data-testid="api-docs-loading" role="status">
        <Spin aria-label={t("pages.about.apiDocsLoading")} />
        <Typography.Text>{t("pages.about.apiDocsLoading")}</Typography.Text>
      </section>
    );
  }

  return (
    <section className="api-docs-container" data-testid="api-docs-container">
      <iframe
        className="api-docs-frame"
        data-testid="api-docs-frame"
        referrerPolicy="no-referrer"
        src={source}
        title={t("pages.about.apiDocsTitle")}
      />
    </section>
  );
}
