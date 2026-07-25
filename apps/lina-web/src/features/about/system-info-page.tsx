import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import Descriptions from "@douyinfe/semi-ui/lib/es/descriptions";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Tooltip from "@douyinfe/semi-ui/lib/es/tooltip";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { createAboutApi } from "#/api/about";
import type { SystemComponentInfo } from "#/api/about";
import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";

function VersionValue({ copyLabel, onCopy, testId, value }: { copyLabel: string; onCopy(value: string): void; testId: string; value: string }) {
  return <div className="system-info-version-row">
    <Tooltip content={value}>
      <Typography.Text className="system-info-component-version" data-testid={testId} title={value} type="tertiary">
        {value}
      </Typography.Text>
    </Tooltip>
    <Button aria-label={copyLabel} data-testid={`${testId}-copy`} onClick={() => onCopy(value)} size="small" theme="borderless">
      {copyLabel}
    </Button>
  </div>;
}

function ComponentList({ items, onCopy, t }: { items: readonly SystemComponentInfo[]; onCopy(value: string): void; t(key: string): string }) {
  return (
    <div className="component-info-grid">
      {items.map((item) => (
        <article data-testid={`system-info-component-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} key={item.name}>
          <Typography.Text strong>{item.name}</Typography.Text>
          <VersionValue
            copyLabel={t("pages.about.copy")}
            onCopy={onCopy}
            testId={`system-info-component-version-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            value={item.version}
          />
          <Typography.Text link={{ href: item.url, target: "_blank" }}>{item.description}</Typography.Text>
        </article>
      ))}
    </div>
  );
}

export default function SystemInfoPage() {
  const { apiClient } = useWorkbenchRuntime();
  const { i18n, t } = useTranslation();
  const api = createAboutApi(apiClient);
  const query = useQuery({
    queryFn: () => api.getSystemInfo(),
    queryKey: ["system", "info", i18n.resolvedLanguage],
  });
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      Toast.success(t("pages.about.copySuccess"));
    } catch {
      Toast.error(t("pages.about.copyFailed"));
    }
  }
  if (query.isPending) {
    return <Spin aria-label={t("pages.common.loading")} />;
  }
  if (query.isError || !query.data) {
    return <Typography.Text role="alert" type="danger">{query.error?.message || t("pages.common.loadFailed")}</Typography.Text>;
  }
  const info = query.data;
  const frameworkData = [
    { key: t("pages.about.projectName"), value: info.framework.name },
    { key: t("pages.about.projectDescription"), value: info.framework.description },
    { key: t("pages.about.version"), value: info.framework.version },
    { key: t("pages.about.license"), value: info.framework.license },
    {
      key: t("pages.about.homepage"),
      value: <Typography.Text link={{ href: info.framework.homepage, target: "_blank" }}>{t("pages.about.openLink")}</Typography.Text>,
    },
    {
      key: t("pages.about.repositoryAddress"),
      value: <Typography.Text link={{ href: info.framework.repositoryUrl, target: "_blank" }}>{t("pages.about.openLink")}</Typography.Text>,
    },
    { key: t("pages.about.runtime"), value: `${info.goVersion} / ${info.gfVersion}` },
    { key: t("pages.about.platform"), value: `${info.os} / ${info.arch}` },
    { key: t("pages.about.uptime"), value: info.runDuration },
  ];
  return (
    <section className="feature-page" data-testid="system-info-page">
      <Card className="system-info-card" data-testid="system-info-about" title={t("pages.about.frameworkSection")}>
        <Descriptions align="left" column={1} data={frameworkData} row />
        <div className="system-info-technical-field">
          <Typography.Text type="tertiary">{t("pages.about.database")}</Typography.Text>
          <VersionValue copyLabel={t("pages.about.copy")} onCopy={(value) => void copy(value)} testId="system-info-database-version" value={info.dbVersion} />
        </div>
      </Card>
      <Card className="system-info-card" data-testid="system-info-backend" title={t("pages.about.backendSection")}><ComponentList items={info.backendComponents} onCopy={(value) => void copy(value)} t={t} /></Card>
      <Card className="system-info-card" data-testid="system-info-frontend" title={t("pages.about.frontendSection")}><ComponentList items={info.frontendComponents} onCopy={(value) => void copy(value)} t={t} /></Card>
    </section>
  );
}
