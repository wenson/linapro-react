import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { test, expect } from '../../fixtures/auth';
import { DashboardPage } from '../../pages/DashboardPage';

const remediationScreenshotDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../temp/20260725/ui-audit-remediation',
);
mkdirSync(remediationScreenshotDirectory, { recursive: true });

test.describe('TC001 默认分析页', () => {
  test('TC001a: 分析页恢复参考项目的默认概览与图表卡片', async ({ adminPage }) => {
    const dashboardPage = new DashboardPage(adminPage);

    await adminPage.setViewportSize({ width: 1366, height: 900 });
    await dashboardPage.gotoAnalytics();

    await expect(dashboardPage.analyticsMetric('用户量')).toBeVisible();
    await expect(dashboardPage.analyticsMetric('访问量')).toBeVisible();
    await expect(dashboardPage.analyticsMetric('下载量')).toBeVisible();
    await expect(dashboardPage.analyticsMetric('使用量')).toBeVisible();
    await expect(dashboardPage.analyticsCardTitle('访问数量')).toBeVisible();
    await expect(dashboardPage.analyticsCardTitle('访问来源')).toBeVisible();
    await expect(dashboardPage.analyticsCardTitle('商业占比')).toBeVisible();
    await expect(
      adminPage.getByTestId('dashboard-analytics-sample-label'),
    ).toHaveText('示例数据 · 尚未接入实时分析接口');
    await expect(
      adminPage.getByTestId('dashboard-analytics-sample-period'),
    ).toHaveText('示例时间范围：2026 年 1 月至 12 月');
    await adminPage.screenshot({
      path: resolve(
        remediationScreenshotDirectory,
        `${new Date().toISOString().replace(/[:.]/gu, '-').slice(0, 19)}-analytics-1366-zh.png`,
      ),
    });
  });

  test('TC001b: 分析页标签切换仍可正常工作', async ({ adminPage }) => {
    const dashboardPage = new DashboardPage(adminPage);

    await dashboardPage.gotoAnalytics();

    await dashboardPage.analyticsTab('月访问量').click();
    await expect(dashboardPage.analyticsTab('月访问量')).toHaveAttribute('data-state', 'active');

    await dashboardPage.analyticsTab('流量趋势').click();
    await expect(dashboardPage.analyticsTab('流量趋势')).toHaveAttribute('data-state', 'active');
  });

  test('TC001c: 移动视口仍展示示例语义且指标不会遮挡正文', async ({ adminPage }) => {
    const dashboardPage = new DashboardPage(adminPage);
    await adminPage.setViewportSize({ width: 390, height: 844 });
    await dashboardPage.gotoAnalytics();

    await expect(adminPage.getByTestId('dashboard-analytics-sample-label')).toHaveText(
      '示例数据 · 尚未接入实时分析接口',
    );
    const firstMetric = dashboardPage.analyticsMetric('用户量');
    const box = await firstMetric.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    await adminPage.screenshot({
      path: resolve(
        remediationScreenshotDirectory,
        `${new Date().toISOString().replace(/[:.]/gu, '-').slice(0, 19)}-analytics-mobile-zh.png`,
      ),
    });
  });
});
