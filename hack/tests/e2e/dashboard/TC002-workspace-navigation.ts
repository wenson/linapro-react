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

test.describe('TC002 默认工作台', () => {
  test('TC002a: 工作台展示管理后台技术栈项目卡片、快捷导航和 LinaPro 示例内容', async ({
    adminPage,
  }) => {
    const dashboardPage = new DashboardPage(adminPage);

    await adminPage.setViewportSize({ width: 1366, height: 900 });
    await dashboardPage.gotoWorkspace();

    await expect(dashboardPage.workspaceDescription).toContainText('今日晴');
    await expect(
      dashboardPage.workspaceProjects.getByText('LinaPro', { exact: true }),
    ).toBeVisible();
    await expect(
      dashboardPage.workspaceProjects.locator('img[alt="LinaPro"]'),
    ).toHaveAttribute('src', /\/logo\.webp$/);
    await expect(
      dashboardPage.workspaceProjects.getByText('GoFrame', { exact: true }),
    ).toBeVisible();
    await expect(
      dashboardPage.workspaceProjects.locator('img[alt="GoFrame"]'),
    ).toHaveAttribute('src', /\/goframe-logo\.webp$/);
    await expect(
      dashboardPage.workspaceProjects.getByText('React', { exact: true }),
    ).toBeVisible();
    await expect(
      dashboardPage.workspaceProjects.getByText('Semi Design', { exact: true }),
    ).toBeVisible();
    await expect(
      dashboardPage.workspaceProjects.getByText('TapCanvas', { exact: true }),
    ).toBeVisible();
    await expect(
      dashboardPage.workspaceProjects.getByText('TypeScript', { exact: true }),
    ).toBeVisible();
    await expect(
      dashboardPage.workspaceProjects.getByText('2026-05-01', { exact: true }),
    ).toHaveCount(6);
    await expect(dashboardPage.workspaceQuickNavItem('用户管理')).toBeVisible();
    await expect(dashboardPage.workspaceQuickNavItem('菜单管理')).toBeVisible();
    await expect(dashboardPage.workspaceQuickNavItem('系统参数')).toBeVisible();
    await expect(dashboardPage.workspaceQuickNavItem('扩展中心')).toBeVisible();
    await expect(dashboardPage.workspaceQuickNavItem('接口文档')).toBeVisible();
    await expect(dashboardPage.workspaceQuickNavItem('定时任务')).toBeVisible();
    await expect(
      dashboardPage.workspaceTodos.getByText('检查工作台快捷入口', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      dashboardPage.workspaceTrends.getByText('工作台快捷导航', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(adminPage.getByTestId('dashboard-workspace-sample-label')).toHaveText(
      '开发引导 · 示例内容并非实时项目数据',
    );
    await expect(dashboardPage.workspaceDescription).toHaveAttribute(
      'title',
      '今日晴，从受治理的 LinaPro 工作台继续工作。',
    );
    await adminPage.screenshot({
      path: resolve(
        remediationScreenshotDirectory,
        `${new Date().toISOString().replace(/[:.]/gu, '-').slice(0, 19)}-workspace-1366-zh.png`,
      ),
    });
  });

  test('TC002b: 工作台快捷导航跳转到当前项目的可达页面', async ({ adminPage }) => {
    const dashboardPage = new DashboardPage(adminPage);
    const quickNavCases: Array<[string, RegExp]> = [
      ['用户管理', /\/system\/user/],
      ['菜单管理', /\/system\/menu/],
      ['系统参数', /\/system\/config/],
      ['扩展中心', /\/system\/plugin/],
      ['接口文档', /\/about\/api-docs/],
      ['定时任务', /\/system\/job/],
    ];

    for (const [label, expectedUrl] of quickNavCases) {
      await dashboardPage.gotoWorkspace();
      await dashboardPage.clickWorkspaceQuickNav(label);
      await expect(adminPage).toHaveURL(expectedUrl);
    }
  });

  test('TC002c: 移动视口项目描述仍提供完整提示', async ({ adminPage }) => {
    const dashboardPage = new DashboardPage(adminPage);
    await adminPage.setViewportSize({ width: 390, height: 844 });
    await dashboardPage.gotoWorkspace();

    const description = dashboardPage.workspaceProjects.locator('.workspace-project-description').first();
    await expect(description).toHaveAttribute('title');
    await expect(adminPage.getByTestId('dashboard-workspace-sample-label')).toHaveText(
      '开发引导 · 示例内容并非实时项目数据',
    );
    const platformLabel = adminPage.getByText('平台', { exact: true }).first();
    await expect(platformLabel).toHaveCSS('white-space', 'nowrap');
    expect((await platformLabel.boundingBox())?.height).toBeLessThanOrEqual(24);
    const workspaceLayout = await dashboardPage.workspacePage.evaluate((page) => ({
      childShrinkValues: Array.from(page.children).map(
        (child) => window.getComputedStyle(child).flexShrink,
      ),
      clientHeight: page.clientHeight,
      scrollHeight: page.scrollHeight,
    }));
    expect(workspaceLayout.childShrinkValues.every((value) => value === '0')).toBe(true);
    expect(workspaceLayout.scrollHeight).toBeGreaterThan(workspaceLayout.clientHeight);
    await dashboardPage.workspaceTrends.scrollIntoViewIfNeeded();
    await expect(dashboardPage.workspaceTrends).toBeInViewport();
    await adminPage.screenshot({
      path: resolve(
        remediationScreenshotDirectory,
        `${new Date().toISOString().replace(/[:.]/gu, '-').slice(0, 19)}-workspace-mobile-zh.png`,
      ),
    });
  });
});
