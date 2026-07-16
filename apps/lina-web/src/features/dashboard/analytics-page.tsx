import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { EChart } from "#/features/dashboard/echart";

type AnalyticsTab = "trends" | "visits";

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("trends");
  const trendOption = useMemo(
    () => ({
      grid: { bottom: 28, left: 44, right: 20, top: 24 },
      series: [
        {
          areaStyle: { opacity: 0.12 },
          data: [118, 132, 146, 168, 184, 203, 226],
          smooth: true,
          type: "line" as const,
        },
      ],
      tooltip: { trigger: "axis" as const },
      xAxis: {
        data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        type: "category" as const,
      },
      yAxis: { type: "value" as const },
    }),
    [],
  );
  const visitsOption = useMemo(
    () => ({
      grid: { bottom: 28, left: 44, right: 20, top: 24 },
      series: [
        {
          data: [820, 932, 901, 934, 1290, 1330, 1520, 1420, 1680, 1820, 2010, 2240],
          smooth: true,
          type: "bar" as const,
        },
      ],
      tooltip: { trigger: "axis" as const },
      xAxis: {
        data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        type: "category" as const,
      },
      yAxis: { type: "value" as const },
    }),
    [],
  );
  const sourceOption = useMemo(
    () => ({
      legend: { bottom: 0 },
      series: [
        {
          data: [
            { name: t("pages.dashboard.sources.direct"), value: 46 },
            { name: t("pages.dashboard.sources.search"), value: 34 },
            { name: t("pages.dashboard.sources.referral"), value: 20 },
          ],
          radius: ["45%", "70%"],
          type: "pie" as const,
        },
      ],
      tooltip: { trigger: "item" as const },
    }),
    [t],
  );
  const channelOption = useMemo(
    () => ({
      grid: { bottom: 24, left: 36, right: 16, top: 18 },
      series: [{ data: [46, 32, 28, 21, 16], type: "bar" as const }],
      xAxis: { data: ["Web", "Mobile", "Client", "Partner", "Other"], type: "category" as const },
      yAxis: { type: "value" as const },
    }),
    [],
  );
  const salesOption = useMemo(
    () => ({
      series: [
        {
          data: [
            { name: "Delivery", value: 42 },
            { name: "Customization", value: 35 },
            { name: "Consulting", value: 23 },
          ],
          radius: "68%",
          type: "pie" as const,
        },
      ],
      tooltip: { trigger: "item" as const },
    }),
    [],
  );
  const metrics: ReadonlyArray<readonly [string, string, string]> = [
    ["pages.dashboard.analytics.overview.users.title", "2,000", "120,000"],
    ["pages.dashboard.analytics.overview.visits.title", "20,000", "500,000"],
    ["pages.dashboard.analytics.overview.downloads.title", "8,000", "120,000"],
    ["pages.dashboard.analytics.overview.usage.title", "5,000", "50,000"],
  ];

  return (
    <section className="feature-page" data-testid="dashboard-analytics-page">
      <header className="feature-page-header">
        <Typography.Title heading={3}>{t("pages.dashboard.analyticsTitle")}</Typography.Title>
        <Typography.Paragraph type="tertiary">
          {t("pages.dashboard.analyticsDescription")}
        </Typography.Paragraph>
      </header>
      <div data-testid="dashboard-analytics-overview">
        <div className="metric-grid">
          {metrics.map(([key, value, total]) => (
            <Card key={key} shadows="hover">
              <Typography.Text type="tertiary">{t(key)}</Typography.Text>
              <Typography.Title heading={4}>{value}</Typography.Title>
              <Typography.Text type="tertiary">{total}</Typography.Text>
            </Card>
          ))}
        </div>
      </div>
      <Card className="dashboard-analytics-tabs" data-testid="dashboard-analytics-tabs">
        <div className="dashboard-tab-actions">
          {(["trends", "visits"] as AnalyticsTab[]).map((tab) => (
            <Button
              data-state={activeTab === tab ? "active" : "inactive"}
              key={tab}
              onClick={() => setActiveTab(tab)}
              theme={activeTab === tab ? "solid" : "borderless"}
              type="primary"
            >
              {t(`pages.dashboard.analytics.tabs.${tab}`)}
            </Button>
          ))}
        </div>
        <EChart
          ariaLabel={t(`pages.dashboard.analytics.tabs.${activeTab}`)}
          option={activeTab === "trends" ? trendOption : visitsOption}
        />
      </Card>
      <div className="dashboard-chart-grid dashboard-chart-grid-three">
        <Card
          title={(
            <Typography.Title heading={5}>
              {t("pages.dashboard.analytics.cards.channels")}
            </Typography.Title>
          )}
        >
          <EChart ariaLabel={t("pages.dashboard.analytics.cards.channels")} option={channelOption} />
        </Card>
        <Card
          title={(
            <Typography.Title heading={5}>
              {t("pages.dashboard.analytics.cards.sources")}
            </Typography.Title>
          )}
        >
          <EChart ariaLabel={t("pages.dashboard.analytics.cards.sources")} option={sourceOption} />
        </Card>
        <Card
          title={(
            <Typography.Title heading={5}>
              {t("pages.dashboard.analytics.cards.sales")}
            </Typography.Title>
          )}
        >
          <EChart ariaLabel={t("pages.dashboard.analytics.cards.sales")} option={salesOption} />
        </Card>
      </div>
    </section>
  );
}
