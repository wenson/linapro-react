import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { DashboardPage } from '../../pages/DashboardPage';
import { LoginPage } from '../../pages/LoginPage';
import { config, workspacePath } from '../../fixtures/config';
import { test, expect } from '../../fixtures/auth';

test.describe('TC-1 登录验证', () => {
  test('TC-1a: 登录后直接落到有权限页面且全过程不出现不存在页面', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.startMissingPageWatch();
    await loginPage.loginAndWaitForRedirect(config.adminUser, config.adminPass);
    await loginPage.waitForAuthorizedLanding();

    await expect(page).toHaveURL(/\/admin\/(?:dashboard|system|profile|about|monitor|developer|platform|tenant)\//);
    expect(await loginPage.missingPageWasObserved()).toBe(false);
    await expect(page.getByText(/页面不存在|Page not found|\b404\b/i)).toHaveCount(0);
  });

  test('TC-1b: 已认证工作台页面保持可用', async ({ adminPage }) => {
    await expect(adminPage.locator('.workbench-layout')).toBeVisible();
    await expect(adminPage.getByText(/页面不存在|Page not found|\b404\b/i)).toHaveCount(0);
  });

  test('TC-1c: 从工作台根路径登录后进入用户默认首页而非根路径 404', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoPath(workspacePath('/').replace(/\/$/, ''));
    await expect(page).toHaveURL(/\/admin\/auth\/login\?redirect=%2F/);
    await loginPage.loginAndWaitForRedirect(config.adminUser, config.adminPass);

    await expect(page).toHaveURL(/\/admin\/dashboard\/analytics$/);
    await expect(page.locator('body')).not.toHaveText(/404|error|not found/i);
    await expect(new DashboardPage(page).analyticsPage).toBeVisible();

    const timestamp = new Date();
    const date = timestamp.toISOString().slice(0, 10).replaceAll('-', '');
    const time = timestamp.toTimeString().slice(0, 8).replaceAll(':', '');
    const screenshotDirectory = path.resolve('../../temp', date);
    mkdirSync(screenshotDirectory, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotDirectory, `${time}-root-redirect-login.png`),
      fullPage: false,
    });
  });
});
