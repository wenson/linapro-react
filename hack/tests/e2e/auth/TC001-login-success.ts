import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { DashboardPage } from '../../pages/DashboardPage';
import { LoginPage } from '../../pages/LoginPage';
import { config, workspacePath } from '../../fixtures/config';
import { test, expect } from '../../fixtures/auth';

test.describe('TC001 登录验证', () => {
  test('TC001a: 登录后跳转到宿主工作区', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForRedirect(config.adminUser, config.adminPass);
    expect(page.url()).not.toContain('/auth/login');
  });

  test('TC001b: 登录后页面正常加载', async ({ adminPage }) => {
    // Should see the main layout (sidebar or dashboard content)
    await expect(
      adminPage.locator('body'),
    ).not.toHaveText(/404|error|not found/i);
  });

  test('TC001c: 从工作台根路径登录后进入用户默认首页而非根路径 404', async ({
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
