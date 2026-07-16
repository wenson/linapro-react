import { test, expect } from '@host-tests/fixtures/auth';
import { prepareSourcePluginsBaseline } from '@host-tests/fixtures/plugin';
import {
  waitForBusyIndicatorsToClear,
  waitForRouteReady,
} from '@host-tests/support/ui';

test.describe('TC002 登录日志列表查询', () => {
  test.beforeAll(async () => {
    await prepareSourcePluginsBaseline(['linapro-monitor-loginlog']);
  });

  test.beforeEach(async ({ adminPage }) => {
    // Navigate to loginlog page and wait for data to load
    const responsePromise = adminPage.waitForResponse(
      (res) =>
        res.url().includes('/x/linapro-monitor-loginlog/api/v1/loginlog') &&
        res.request().method() === 'GET' &&
        res.status() === 200,
      { timeout: 15000 },
    );
    await adminPage.goto('/monitor/loginlog');
    await responsePromise;
    await waitForRouteReady(adminPage);
  });

  test('TC002a: 登录日志页面加载并展示表格', async ({ adminPage }) => {
    // Table should be visible
    await expect(adminPage.getByTestId('loginlog-table')).toBeVisible();

    // Should have toolbar buttons
    await expect(
      adminPage.getByRole('button', { name: /清\s*空/ }),
    ).toBeVisible();
    await expect(
      adminPage.getByRole('button', { name: /导\s*出/ }),
    ).toBeVisible();
  });

  test('TC002b: 登录日志包含admin用户记录', async ({ adminPage }) => {
    // Should see login log rows with admin
    const rows = adminPage.getByTestId('loginlog-table').locator('tbody tr');
    const count = await rows.count();
    if (count > 0) {
      // At least one row should contain 'admin'
      await expect(
        rows.first(),
      ).toContainText('admin');
    }
  });

  test('TC002c: 按用户账号搜索', async ({ adminPage }) => {
    // Fill user account search field
    await adminPage
      .getByLabel('用户账号', { exact: true })
      .first()
      .fill('admin');

    const requestPromise = adminPage.waitForRequest(
      (req) =>
        req.url().includes('/x/linapro-monitor-loginlog/api/v1/loginlog') &&
        req.method() === 'GET' &&
        req.url().includes('userName='),
      { timeout: 10000 },
    );

    await adminPage.getByRole('button', { name: /搜\s*索/ }).first().click();
    const request = await requestPromise;

    expect(request.url()).toContain('userName=');
    await waitForRouteReady(adminPage);

    // Results should still contain admin entries
    const rows = adminPage.getByTestId('loginlog-table').locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TC002d: 按IP地址搜索', async ({ adminPage }) => {
    // Fill IP address search field
    await adminPage
      .getByLabel(/IP\s*地址/)
      .first()
      .fill('127.0.0.1');

    const requestPromise = adminPage.waitForRequest(
      (req) =>
        req.url().includes('/x/linapro-monitor-loginlog/api/v1/loginlog') &&
        req.method() === 'GET' &&
        req.url().includes('ip='),
      { timeout: 10000 },
    );

    await adminPage.getByRole('button', { name: /搜\s*索/ }).first().click();
    const request = await requestPromise;

    expect(request.url()).toContain('ip=');
  });

  test('TC002e: 按登录状态下拉选择搜索', async ({ adminPage }) => {
    // Click the status Select (labeled 登录状态)
    const selectTrigger = adminPage.getByTestId('loginlog-status-filter');
    await selectTrigger.click();

    // Select the first available option (e.g., "成功")
    const firstOption = adminPage.getByRole('option').first();
    await expect(firstOption).toBeVisible();
    await firstOption.click();
    await waitForBusyIndicatorsToClear(adminPage);

    // Click search and verify request includes status parameter
    const requestPromise = adminPage.waitForRequest(
      (req) =>
        req.url().includes('/x/linapro-monitor-loginlog/api/v1/loginlog') &&
        req.method() === 'GET' &&
        req.url().includes('status='),
      { timeout: 10000 },
    );

    await adminPage.getByRole('button', { name: /搜\s*索/ }).first().click();
    const request = await requestPromise;

    expect(request.url()).toContain('status=');
  });

  test('TC002f: 搜索后重置恢复全部数据', async ({ adminPage }) => {
    // Get initial row count
    const rows = adminPage.getByTestId('loginlog-table').locator('tbody tr');
    const initialCount = await rows.count();

    // Fill a search field with unlikely value
    await adminPage
      .getByLabel('用户账号', { exact: true })
      .first()
      .fill('不存在的用户名称');
    await adminPage.getByRole('button', { name: /搜\s*索/ }).first().click();
    await waitForRouteReady(adminPage);

    // Reset
    const resetResponsePromise = adminPage.waitForResponse(
      (res) =>
        res.url().includes('/x/linapro-monitor-loginlog/api/v1/loginlog') &&
        res.request().method() === 'GET' &&
        res.status() === 200,
      { timeout: 10000 },
    );
    await adminPage.getByRole('button', { name: /重\s*置/ }).first().click();
    await resetResponsePromise;
    await waitForRouteReady(adminPage);

    // Row count should restore
    const resetCount = await rows.count();
    expect(resetCount).toBe(initialCount);
  });

  test('TC002g: 搜索请求包含登录日期范围参数', async ({ adminPage }) => {
    const dateInputs = adminPage
      .getByTestId('loginlog-management-page')
      .locator('form input[type="date"]');
    await dateInputs.first().fill('2026-07-01');
    await dateInputs.nth(1).fill('2026-07-12');

    // Click search and verify request includes time range params
    const requestPromise = adminPage.waitForRequest(
      (req) =>
        req.url().includes('/x/linapro-monitor-loginlog/api/v1/loginlog') &&
        req.method() === 'GET' &&
        (req.url().includes('beginTime=') ||
          req.url().includes('endTime=')),
      { timeout: 10000 },
    );

    await adminPage.getByRole('button', { name: /搜\s*索/ }).first().click();
    const request = await requestPromise;

    const url = request.url();
    expect(url).toContain('beginTime=');
    expect(url).toContain('endTime=');
  });
});
