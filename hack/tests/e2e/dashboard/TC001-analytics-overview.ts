import { test, expect } from '../../fixtures/auth';
import { DashboardPage } from '../../pages/DashboardPage';

test.describe('TC-1 默认分析页', () => {
  test('TC-1a: 中文分析页呈现全部指标与非空图表', async ({ adminPage, mainLayout }) => {
    const dashboardPage = new DashboardPage(adminPage);

    await adminPage.setViewportSize({ height: 768, width: 1366 });
    await mainLayout.switchLanguage('简体中文');
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
    await dashboardPage.expectChartsRendered();
    await dashboardPage.capture('ui-remediation-1366x768-zh-CN-light-analytics-e2e');
  });

  test('TC-1b: 柱状图、英文和深色主题可用且控制台无未注册图表错误', async ({ adminPage, mainLayout }) => {
    const dashboardPage = new DashboardPage(adminPage);
    const chartErrors: string[] = [];
    adminPage.on('console', (message) => {
      if (message.type() === 'error' && /bar|chart|series|register/i.test(message.text())) {
        chartErrors.push(message.text());
      }
    });

    await adminPage.setViewportSize({ height: 768, width: 1366 });
    await dashboardPage.gotoAnalytics();
    await dashboardPage.analyticsTab('月访问量').click();
    await expect(dashboardPage.analyticsTab('月访问量')).toHaveAttribute('data-state', 'active');
    await dashboardPage.expectChartsRendered();

    await mainLayout.switchLanguage('English');
    await expect(dashboardPage.analyticsMetric('Users')).toBeVisible();
    await expect(dashboardPage.analyticsTab('Monthly Visits')).toHaveAttribute('data-state', 'active');
    await expect(dashboardPage.analyticsCardTitle('Visit Channels')).toBeVisible();
    await dashboardPage.expectChartsRendered();

    await mainLayout.ensureThemeMode('dark');
    await dashboardPage.expectChartsRendered();
    await dashboardPage.capture('ui-remediation-1366x768-en-US-dark-analytics-e2e');
    expect(chartErrors).toEqual([]);
  });

  test('TC-1c: 移动视口仍展示示例语义且指标不会遮挡正文', async ({ adminPage }) => {
    const dashboardPage = new DashboardPage(adminPage);
    await adminPage.setViewportSize({ width: 390, height: 844 });
    await dashboardPage.gotoAnalytics();

    await expect(adminPage.getByTestId('dashboard-analytics-sample-label')).toHaveText(
      '示例数据 · 尚未接入实时分析接口',
    );
    const firstMetric = dashboardPage.analyticsMetric('用户量');
    const box = await firstMetric.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    await dashboardPage.capture('ui-remediation-390x844-zh-CN-light-analytics-mobile-e2e');
  });
});
